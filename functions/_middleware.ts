/**
 * Cloudflare Pages Functions — Middleware
 * 1. 敏感路徑強制 404（資安 audit P2 #7、補 SPA fallback 的洞）
 * 2. CORS（僅允許 REYWAY 品牌域名 + 本地開發）
 */

interface PagesFunction<Env = unknown> {
  (context: {
    request: Request;
    env: Env;
    next: () => Promise<Response>;
  }): Response | Promise<Response>;
}

const ALLOWED_ORIGINS = [
  "https://eagle.reyway.com",
  "https://suan7.reyway.com",
  "https://club.reyway.com",
  "https://cleanclean.reyway.com",
  "http://localhost:5173",
];

// 🔒 資安 audit P2 #7（2026-04-26）：
// CF Pages 對「destination 不存在的路徑」會 ignore _redirects、
// SPA fallback 會把 /.env /.git/HEAD /wrangler.toml 等回 200 + index.html。
// 改用 middleware 直接攔截、回真正的 404。
const SENSITIVE_PATHS = [
  /^\/\.env(\.|$)/,
  /^\/\.git(\/|$)/,
  /^\/\.dev\.vars$/,
  /^\/\.npmrc$/,
  /^\/\.prettierrc$/,
  /^\/wrangler\.toml$/,
  /^\/package(-lock)?\.json$/,
  /^\/pnpm-lock\.yaml$/,
  /^\/yarn\.lock$/,
  /^\/tsconfig(\..*)?\.json$/,
  /^\/vite\.config\.(ts|js)$/,
  /^\/Dockerfile$/i,
  /^\/docker-compose\..*$/i,
];

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // ── 1. 敏感路徑：直接回 404 ──
  if (SENSITIVE_PATHS.some((re) => re.test(url.pathname))) {
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex" },
    });
  }

  const origin = context.request.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // ── 2. CORS preflight ──
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-TRPC-Source",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── 3. 正常請求 + 注入 CORS headers ──
  const response = await context.next();
  const newResponse = new Response(response.body, response);
  if (isAllowed) {
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
  }
  newResponse.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  newResponse.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-TRPC-Source"
  );

  return newResponse;
};
