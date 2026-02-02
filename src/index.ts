import { Env, ApiResponse } from "./types";
import { GameRoom } from "./durable-objects/GameRoom";
import { createAgent } from "./middleware/auth";
import { createGame, joinGame, getLeaderboard, getGameHistory, handleWebSocket } from "./handlers/game";
import { banGeneral, pickGeneral, deployGenerals, executeAction } from "./handlers/action";
import { getGameState, getGeneralsList, healthCheck } from "./handlers/query";

// 导出Durable Object
export { GameRoom };

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// 路由匹配
function matchRoute(pathname: string, pattern: string): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// 主处理函数
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // OPTIONS 预检
  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let response: Response;

  try {
    // 健康检查
    if (pathname === "/health") {
      return addCorsHeaders(Response.json({ status: "ok", timestamp: new Date().toISOString() }));
    }

    // 注册
    if (method === "POST" && pathname === "/api/register") {
      const { name } = (await request.json()) as { name: string };
      // 生成 API Key
      const apiKey = crypto.randomUUID() + "-" + crypto.randomUUID();
      const result = await createAgent(env, name, apiKey);
      if (result.success) {
        response = Response.json({ 
          success: true, 
          data: { 
            agent_id: result.agentId, 
            api_key: apiKey,
            message: "请保存好API Key，它不会再次显示" 
          } 
        });
      } else {
        response = Response.json({ success: false, error: { code: 500, message: result.error } }, { status: 500 });
      }
    }
    // 武将列表
    else if (method === "GET" && pathname === "/api/generals") {
      response = await getGeneralsList(request, env);
    }
    // 排行榜
    else if (method === "GET" && pathname === "/api/leaderboard") {
      response = await getLeaderboard(request, env);
    }
    // 游戏历史
    else if (method === "GET" && pathname === "/api/games/history") {
      response = await getGameHistory(request, env);
    }
    // 创建游戏
    else if (method === "POST" && pathname === "/api/games") {
      response = await createGame(request, env);
    }
    // 加入游戏
    else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/join")) {
      const params = matchRoute(pathname, "/api/games/:gameId/join")!;
      response = await joinGame(request, env, params.gameId);
    }
    // 游戏状态
    else if (method === "GET" && matchRoute(pathname, "/api/games/:gameId/state")) {
      const params = matchRoute(pathname, "/api/games/:gameId/state")!;
      const player = url.searchParams.get("player") as "p1" | "p2" || "p1";
      response = await getGameState(request, env, params.gameId, player);
    }
    // WebSocket
    else if (matchRoute(pathname, "/api/games/:gameId/ws") && request.headers.get("Upgrade") === "websocket") {
      const params = matchRoute(pathname, "/api/games/:gameId/ws")!;
      return handleWebSocket(request, env, params.gameId);
    }
    // Ban武将
    else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/ban")) {
      const params = matchRoute(pathname, "/api/games/:gameId/ban")!;
      const player = url.searchParams.get("player") as "p1" | "p2" || "p1";
      response = await banGeneral(request, env, params.gameId, player);
    }
    // Pick武将
    else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/pick")) {
      const params = matchRoute(pathname, "/api/games/:gameId/pick")!;
      const player = url.searchParams.get("player") as "p1" | "p2" || "p1";
      response = await pickGeneral(request, env, params.gameId, player);
    }
    // 部署
    else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/deploy")) {
      const params = matchRoute(pathname, "/api/games/:gameId/deploy")!;
      const player = url.searchParams.get("player") as "p1" | "p2" || "p1";
      response = await deployGenerals(request, env, params.gameId, player);
    }
    // 游戏操作
    else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/action")) {
      const params = matchRoute(pathname, "/api/games/:gameId/action")!;
      const player = url.searchParams.get("player") as "p1" | "p2" || "p1";
      response = await executeAction(request, env, params.gameId, player);
    }
    // 404
    else {
      response = Response.json(
        { success: false, error: { code: 404, message: "Not found" } },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    response = Response.json(
      { success: false, error: { code: 500, message: String(error) } },
      { status: 500 }
    );
  }

  return addCorsHeaders(response);
}

export default {
  fetch: handleRequest,
};
