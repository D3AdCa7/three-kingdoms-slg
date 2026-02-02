import { Env, ApiResponse, PlayerSide } from "../types";
import { executeQuery, executeUpdate, queries } from "../db/tidb";

// 创建游戏
export async function createGame(request: Request, env: Env): Promise<Response> {
  try {
    const { agent_id } = await request.json() as { agent_id: string };
    
    if (!agent_id) {
      return Response.json({ success: false, error: { code: 1000, message: "缺少agent_id" } }, { status: 400 });
    }
    
    const gameId = crypto.randomUUID();
    
    // 在 TiDB 创建记录
    await executeUpdate(env, queries.createGame, [gameId, agent_id]);
    
    // 获取 Durable Object
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    // 初始化游戏房间
    const response = await room.fetch(new Request("http://internal/create", {
      method: "POST",
      body: JSON.stringify({ gameId, p1: agent_id })
    }));
    
    if (!response.ok) {
      throw new Error("Failed to create game room");
    }
    
    return Response.json({
      success: true,
      data: {
        game_id: gameId,
        player: "p1",
        status: "waiting",
        ws_url: `wss://${new URL(request.url).host}/api/games/${gameId}/ws?player=p1`
      }
    });
  } catch (error) {
    console.error("Create game error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 加入游戏
export async function joinGame(request: Request, env: Env, gameId: string): Promise<Response> {
  try {
    const { agent_id } = await request.json() as { agent_id: string };
    
    if (!agent_id) {
      return Response.json({ success: false, error: { code: 1000, message: "缺少agent_id" } }, { status: 400 });
    }
    
    // 更新 TiDB
    const result = await executeUpdate(env, queries.joinGame, [agent_id, gameId]);
    
    if (result.affectedRows === 0) {
      return Response.json({ success: false, error: { code: 1001, message: "游戏不存在或已满" } }, { status: 404 });
    }
    
    // 通知 Durable Object
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const response = await room.fetch(new Request("http://internal/join", {
      method: "POST",
      body: JSON.stringify({ agent_id })
    }));
    
    const data = await response.json() as ApiResponse;
    
    if (!data.success) {
      return Response.json(data, { status: 400 });
    }
    
    return Response.json({
      success: true,
      data: {
        game_id: gameId,
        player: "p2",
        status: "selecting",
        ws_url: `wss://${new URL(request.url).host}/api/games/${gameId}/ws?player=p2`
      }
    });
  } catch (error) {
    console.error("Join game error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取等待中的游戏列表
export async function getWaitingGames(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    const games = await executeQuery<{
      id: string;
      p1_agent_id: string;
      created_at: string;
      p1_name: string;
      p1_elo: number;
    }>(env, queries.getWaitingGames, [Math.min(limit, 50)]);
    
    return Response.json({
      success: true,
      data: { games }
    });
  } catch (error) {
    console.error("Get waiting games error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取游戏信息
export async function getGameInfo(request: Request, env: Env, gameId: string): Promise<Response> {
  try {
    const games = await executeQuery<{
      id: string;
      p1_agent_id: string;
      p2_agent_id: string;
      status: string;
      winner: string;
      win_reason: string;
      total_turns: number;
      p1_name: string;
      p1_elo: number;
      p2_name: string;
      p2_elo: number;
      started_at: string;
      finished_at: string;
      created_at: string;
    }>(env, queries.getGame, [gameId]);
    
    if (games.length === 0) {
      return Response.json({ success: false, error: { code: 1001, message: "游戏不存在" } }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      data: games[0]
    });
  } catch (error) {
    console.error("Get game info error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取游戏历史
export async function getGameHistory(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agent_id");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    
    if (!agentId) {
      return Response.json({ success: false, error: { code: 1000, message: "缺少agent_id" } }, { status: 400 });
    }
    
    const games = await executeQuery<{
      id: string;
      status: string;
      winner: string;
      win_reason: string;
      total_turns: number;
      started_at: string;
      finished_at: string;
      p1_name: string;
      p2_name: string;
    }>(env, queries.getGameHistory, [agentId, agentId, Math.min(limit, 100)]);
    
    return Response.json({
      success: true,
      data: { games }
    });
  } catch (error) {
    console.error("Get game history error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取排行榜
export async function getLeaderboard(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    
    const leaderboard = await executeQuery<{
      id: string;
      name: string;
      elo_rating: number;
      games_played: number;
      games_won: number;
      win_rate: number;
    }>(env, queries.getLeaderboard, [Math.min(limit, 100)]);
    
    return Response.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// WebSocket 连接处理
export async function handleWebSocket(request: Request, env: Env, gameId: string): Promise<Response> {
  const url = new URL(request.url);
  const player = url.searchParams.get("player") as PlayerSide;
  
  if (!player || (player !== "p1" && player !== "p2")) {
    return new Response("Invalid player parameter", { status: 400 });
  }
  
  const roomId = env.GAME_ROOM.idFromName(gameId);
  const room = env.GAME_ROOM.get(roomId);
  
  // 转发到 Durable Object
  return room.fetch(new Request(`http://internal/ws?player=${player}`, {
    headers: request.headers
  }));
}
