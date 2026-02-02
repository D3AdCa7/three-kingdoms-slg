// CORS 配置
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8787",
  "https://three-kingdoms-slg.pages.dev",
];

// CORS 响应头
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400", // 24小时
  "Access-Control-Expose-Headers": "X-RateLimit-Reset, Retry-After",
};

// 处理 CORS 预检请求
export function handleCorsPreflightRequest(request: Request): Response {
  const origin = request.headers.get("Origin");
  
  // 检查 origin 是否被允许
  const allowedOrigin = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".workers.dev"))
    ? origin
    : "*";
  
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Origin": allowedOrigin,
    },
  });
}

// 添加 CORS 头到响应
export function addCorsHeaders(response: Response, request?: Request): Response {
  const newHeaders = new Headers(response.headers);
  
  // 获取请求的 origin
  const origin = request?.headers.get("Origin");
  const allowedOrigin = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".workers.dev"))
    ? origin
    : "*";
  
  newHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
  newHeaders.set("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]);
  newHeaders.set("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]);
  newHeaders.set("Access-Control-Expose-Headers", corsHeaders["Access-Control-Expose-Headers"]);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// CORS 中间件
export function corsMiddleware(request: Request): Response | null {
  // 处理 OPTIONS 预检请求
  if (request.method === "OPTIONS") {
    return handleCorsPreflightRequest(request);
  }
  
  // 其他请求继续处理
  return null;
}

// 创建带 CORS 头的 JSON 响应
export function jsonResponse(
  data: any,
  status: number = 200,
  request?: Request
): Response {
  const response = Response.json(data, { status });
  return addCorsHeaders(response, request);
}

// 创建带 CORS 头的错误响应
export function errorResponse(
  message: string,
  code: number,
  status: number = 400,
  request?: Request
): Response {
  const response = Response.json(
    { success: false, error: { code, message } },
    { status }
  );
  return addCorsHeaders(response, request);
}

// WebSocket 升级时的 CORS 检查
export function checkWebSocketOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  
  if (!origin) {
    return true; // 无 origin 时允许（某些客户端不发送）
  }
  
  // 检查是否在允许列表
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // 允许 workers.dev 域名
  if (origin.endsWith(".workers.dev")) {
    return true;
  }
  
  // 允许本地开发
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    return true;
  }
  
  return false;
}
