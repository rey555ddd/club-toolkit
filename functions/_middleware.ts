/**
 * Cloudflare Pages Functions Middleware
 * CORS configuration for club-toolkit project
 */

interface PagesFunction<Env = unknown> {
  (context: { request: Request; env: Env }): Response | Promise<Response>;
}

const ALLOWED_ORIGINS = [
  "https://eagle.reyway.com",
  "https://suan7.reyway.com",
  "https://club.reyway.com",
  "https://cleanclean.reyway.com",
  "http://localhost:5173",
];

export const onRequest: PagesFunction = async (context) => {
  const origin = context.request.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Handle preflight requests
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

  // Continue to next middleware/handler
  const response = await context.next();

  // Add CORS headers to response
  const newResponse = new Response(response.body, response);
  if (isAllowed) {
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
  }
  newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newResponse.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-TRPC-Source"
  );

  return newResponse;
};
