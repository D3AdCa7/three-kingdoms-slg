import { Env, PlayerSide } from "../types";

// 限流配置
const RATE_LIMIT_INTERVAL_MS = 5000; // 5秒限流

// 检查限流状态
export async function checkRateLimit(
  env: Env,
  gameId: string,
  playerId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const response = await room.fetch(new Request("http://internal/checkCooldown", {
      method: "POST",
      body: JSON.stringify({ playerId })
    }));
    
    return await response.json();
  } catch (error) {
    console.error("Rate limit check error:", error);
    // 出错时默认允许
    return { allowed: true };
  }
}

// 限流中间件
export async function rateLimitMiddleware(
  request: Request,
  env: Env,
  gameId: string,
  playerId: string
): Promise<Response | null> {
  // 只对操作类请求限流
  const url = new URL(request.url);
  const isActionRequest = 
    url.pathname.includes("/action") ||
    url.pathname.includes("/ban") ||
    url.pathname.includes("/pick") ||
    url.pathname.includes("/deploy");
  
  if (!isActionRequest) {
    return null; // 不限流，继续处理
  }
  
  const result = await checkRateLimit(env, gameId, playerId);
  
  if (!result.allowed) {
    return Response.json(
      {
        success: false,
        error: {
          code: 1003,
          message: "操作冷却中",
          retry_after: result.retryAfter
        }
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter || 5)
        }
      }
    );
  }
  
  return null; // 允许，继续处理
}

// 简单的内存限流器（备用方案，不使用Durable Object时）
class InMemoryRateLimiter {
  private cooldowns: Map<string, number> = new Map();
  
  check(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const cooldownUntil = this.cooldowns.get(key);
    
    if (cooldownUntil && now < cooldownUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((cooldownUntil - now) / 1000)
      };
    }
    
    // 设置新的冷却时间
    this.cooldowns.set(key, now + RATE_LIMIT_INTERVAL_MS);
    
    // 清理过期的条目
    this.cleanup();
    
    return { allowed: true };
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, until] of this.cooldowns) {
      if (until < now) {
        this.cooldowns.delete(key);
      }
    }
  }
}

// 全局限流器实例（用于不使用DO的场景）
const globalRateLimiter = new InMemoryRateLimiter();

// 简单限流（不依赖DO）
export function simpleRateLimit(
  gameId: string,
  playerId: string
): { allowed: boolean; retryAfter?: number } {
  const key = `${gameId}:${playerId}`;
  return globalRateLimiter.check(key);
}

// 创建限流响应
export function rateLimitResponse(retryAfter: number): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: 1003,
        message: "操作冷却中，请稍后重试",
        retry_after: retryAfter
      }
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Date.now() + retryAfter * 1000)
      }
    }
  );
}

// 记录限流日志
export function logRateLimit(gameId: string, playerId: string, allowed: boolean): void {
  if (!allowed) {
    console.log(`[RateLimit] Blocked: game=${gameId}, player=${playerId}`);
  }
}
