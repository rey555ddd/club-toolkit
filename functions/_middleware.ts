/** Cloudflare Pages security boundary for the Club toolkit. */

interface Env {
  RATE_LIMIT_KV?: KVNamespace;
}

interface PagesContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

const FORMAL_HOSTS = new Set(['club.rsway.net', 'club.reyway.com']);
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const SENSITIVE_PATHS = [
  /^\/\.env(\.|$)/,
  /^\/\.git(\/|$)/,
  /^\/\.dev\.vars$/,
  /^\/\.npmrc$/,
  /^\/wrangler\.(?:toml|jsonc)$/,
  /^\/package(-lock)?\.json$/,
  /^\/pnpm-lock\.yaml$/,
  /^\/tsconfig(?:\..*)?\.json$/,
  /^\/vite\.config\.(?:ts|js)$/,
  /^\/(?:server|functions|shared|drizzle)(?:\/|$)/i,
  /\.map$/i,
];

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'; upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
};

const jsonError = (error: string, status: number, extra: Record<string, string> = {}) => Response.json(
  { error },
  { status, headers: { 'Cache-Control': 'no-store', ...SECURITY_HEADERS, ...extra } },
);

const digestKey = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
};

const takeQuota = async (env: Env, request: Request, scope: string, perIp: number, global: number, seconds: number) => {
  if (!env.RATE_LIMIT_KV) return false;
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const actor = await digestKey(request.headers.get('CF-Connecting-IP') || 'unknown');
  const keys = [
    [`security:${scope}:ip:${bucket}:${actor}`, perIp],
    [`security:${scope}:global:${bucket}`, global],
  ] as const;
  for (const [key, limit] of keys) {
    const count = Number(await env.RATE_LIMIT_KV.get(key) || 0);
    if (count >= limit) return false;
    await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: seconds + 60 });
  }
  return true;
};

const exceedsBodyLimit = async (request: Request, maxBytes: number) => {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > maxBytes) return true;
  if (!request.body) return false;
  const reader = request.clone().body!.getReader();
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return false;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return true;
    }
  }
};

export const onRequest = async (context: PagesContext) => {
  const url = new URL(context.request.url);
  if (!FORMAL_HOSTS.has(url.hostname) && !LOCAL_HOSTS.has(url.hostname)) {
    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex' } });
  }
  if (SENSITIVE_PATHS.some((pattern) => pattern.test(url.pathname))) {
    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex' } });
  }

  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(context.request.method);
  const origin = context.request.headers.get('Origin') || '';
  const sameOrigin = origin === url.origin;
  if (unsafe && !sameOrigin) return jsonError('forbidden_origin', 403);
  if (context.request.method === 'OPTIONS') {
    if (!sameOrigin) return jsonError('forbidden_origin', 403);
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-TRPC-Source',
        'Access-Control-Max-Age': '600',
      },
    });
  }

  const procedure = decodeURIComponent(url.pathname);
  const isApiWrite = unsafe && procedure.startsWith('/api/trpc');
  const isImageGeneration = isApiWrite && procedure.includes('poster.generate');
  const isTextGeneration = isApiWrite && /(?:copywriter\.generate|planner\.generate|recruit\.(?:generateCopy|chat|generateReferralMessage)|poster\.suggestCopy)/.test(procedure);
  const maxBytes = isImageGeneration ? 12 * 1024 * 1024 : 512 * 1024;
  if (isApiWrite && await exceedsBodyLimit(context.request, maxBytes)) return jsonError('payload_too_large', 413);

  if (isImageGeneration) {
    const hourOk = await takeQuota(context.env, context.request, 'image-hour', 3, 30, 3600);
    const dayOk = hourOk && await takeQuota(context.env, context.request, 'image-day', 8, 80, 86400);
    if (!hourOk || !dayOk) return jsonError('rate_limit_exceeded', 429, { 'Retry-After': '3600' });
  } else if (isTextGeneration) {
    const hourOk = await takeQuota(context.env, context.request, 'text-hour', 15, 150, 3600);
    const dayOk = hourOk && await takeQuota(context.env, context.request, 'text-day', 40, 400, 86400);
    if (!hourOk || !dayOk) return jsonError('rate_limit_exceeded', 429, { 'Retry-After': '3600' });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  if (url.pathname.startsWith('/api/')) headers.set('Cache-Control', 'no-store');
  if (url.protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.delete('Access-Control-Allow-Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
