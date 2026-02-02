import { Env, PlayerSide } from "../types";
import { executeQuery, queries } from "../db/tidb";

// 认证中间件
export async function authMiddleware(
  request: Request,
  env: Env
): Promise<{ authorized: boolean; agentId?: string; error?: Response }> {
  // 获取 Authorization header
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader) {
    return {
      authorized: false,
      error: Response.json(
        { success: false, error: { code: 401, message: "缺少认证信息" } },
        { status: 401 }
      ),
    };
  }
  
  // 解析 Bearer token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return {
      authorized: false,
      error: Response.json(
        { success: false, error: { code: 401, message: "认证格式错误" } },
        { status: 401 }
      ),
    };
  }
  
  const apiKey = parts[1];
  
  // 计算 API Key 哈希
  const apiKeyHash = await hashApiKey(apiKey);
  
  try {
    // 查询数据库验证
    const agents = await executeQuery<{ id: string; name: string }>(
      env,
      queries.getAgentByApiKeyHash,
      [apiKeyHash]
    );
    
    if (agents.length === 0) {
      return {
        authorized: false,
        error: Response.json(
          { success: false, error: { code: 401, message: "无效的API Key" } },
          { status: 401 }
        ),
      };
    }
    
    return {
      authorized: true,
      agentId: agents[0].id,
    };
  } catch (error) {
    console.error("Auth error:", error);
    
    // 开发环境下允许跳过认证
    if (env.ENVIRONMENT === "development" || !env.TIDB_HOST) {
      // 使用 API Key 作为 agent_id（开发模式）
      return {
        authorized: true,
        agentId: apiKey,
      };
    }
    
    return {
      authorized: false,
      error: Response.json(
        { success: false, error: { code: 500, message: "认证服务错误" } },
        { status: 500 }
      ),
    };
  }
}

// 计算 API Key 哈希
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// 从请求中提取游戏ID
export function extractGameId(pathname: string): string | null {
  const match = pathname.match(/\/api\/games\/([^\/]+)/);
  return match ? match[1] : null;
}

// 从请求中提取玩家身份
export function extractPlayer(request: Request, pathname: string): PlayerSide | null {
  // 从查询参数获取
  const url = new URL(request.url);
  const player = url.searchParams.get("player");
  
  if (player === "p1" || player === "p2") {
    return player;
  }
  
  return null;
}

// 验证玩家是否属于该游戏
export async function validatePlayerInGame(
  env: Env,
  gameId: string,
  agentId: string
): Promise<{ valid: boolean; player?: PlayerSide; error?: Response }> {
  try {
    const games = await executeQuery<{
      p1_agent_id: string;
      p2_agent_id: string;
    }>(env, queries.getGame, [gameId]);
    
    if (games.length === 0) {
      return {
        valid: false,
        error: Response.json(
          { success: false, error: { code: 1001, message: "游戏不存在" } },
          { status: 404 }
        ),
      };
    }
    
    const game = games[0];
    
    if (game.p1_agent_id === agentId) {
      return { valid: true, player: "p1" };
    }
    
    if (game.p2_agent_id === agentId) {
      return { valid: true, player: "p2" };
    }
    
    return {
      valid: false,
      error: Response.json(
        { success: false, error: { code: 403, message: "您不是该游戏的参与者" } },
        { status: 403 }
      ),
    };
  } catch (error) {
    console.error("Validate player error:", error);
    
    // 开发环境下默认允许
    if (env.ENVIRONMENT === "development" || !env.TIDB_HOST) {
      // 根据agentId推断玩家（简单处理）
      return { valid: true, player: "p1" };
    }
    
    return {
      valid: false,
      error: Response.json(
        { success: false, error: { code: 500, message: "验证服务错误" } },
        { status: 500 }
      ),
    };
  }
}

// 创建新Agent
export async function createAgent(
  env: Env,
  name: string,
  apiKey: string
): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    const agentId = crypto.randomUUID();
    const apiKeyHash = await hashApiKey(apiKey);
    
    await executeQuery(env, queries.createAgent, [agentId, name, apiKeyHash]);
    
    return { success: true, agentId };
  } catch (error) {
    console.error("Create agent error:", error);
    return { success: false, error: String(error) };
  }
}

// 简单的开发模式认证（用于测试）
export function devModeAuth(request: Request): { agentId: string } {
  const authHeader = request.headers.get("Authorization");
  
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2) {
      return { agentId: parts[1] };
    }
  }
  
  // 默认测试用户
  return { agentId: "test-agent-1" };
}
