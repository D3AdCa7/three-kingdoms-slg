import { Env, ApiResponse, PlayerSide, ActionType } from "../types";
import { executeUpdate, queries } from "../db/tidb";

// Ban武将
export async function banGeneral(request: Request, env: Env, gameId: string, player: PlayerSide): Promise<Response> {
  try {
    const { general_id } = await request.json() as { general_id: number };
    
    if (typeof general_id !== "number" || general_id < 1 || general_id > 30) {
      return Response.json({ success: false, error: { code: 1010, message: "无效武将ID" } }, { status: 400 });
    }
    
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const response = await room.fetch(new Request("http://internal/ban", {
      method: "POST",
      body: JSON.stringify({ player, general_id })
    }));
    
    const data = await response.json() as ApiResponse;
    
    // 记录Ban统计
    if (data.success) {
      try {
        await executeUpdate(env, queries.updateGeneralBanStats, [general_id]);
      } catch (e) {
        console.error("Failed to update ban stats:", e);
      }
    }
    
    return Response.json(data, { status: data.success ? 200 : 400 });
  } catch (error) {
    console.error("Ban general error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// Pick武将
export async function pickGeneral(request: Request, env: Env, gameId: string, player: PlayerSide): Promise<Response> {
  try {
    const { general_id } = await request.json() as { general_id: number };
    
    if (typeof general_id !== "number" || general_id < 1 || general_id > 30) {
      return Response.json({ success: false, error: { code: 1010, message: "无效武将ID" } }, { status: 400 });
    }
    
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const response = await room.fetch(new Request("http://internal/pick", {
      method: "POST",
      body: JSON.stringify({ player, general_id })
    }));
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error("Pick general error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 部署武将
export async function deployGenerals(request: Request, env: Env, gameId: string, player: PlayerSide): Promise<Response> {
  try {
    const { deployments } = await request.json() as { deployments: { general_id: number; x: number; y: number }[] };
    
    if (!Array.isArray(deployments) || deployments.length === 0) {
      return Response.json({ success: false, error: { code: 1000, message: "缺少部署信息" } }, { status: 400 });
    }
    
    // 验证部署数据格式
    for (const dep of deployments) {
      if (typeof dep.general_id !== "number" || typeof dep.x !== "number" || typeof dep.y !== "number") {
        return Response.json({ success: false, error: { code: 1000, message: "部署数据格式错误" } }, { status: 400 });
      }
      if (dep.x < 0 || dep.x >= 100 || dep.y < 0 || dep.y >= 100) {
        return Response.json({ success: false, error: { code: 1013, message: "坐标超出地图范围" } }, { status: 400 });
      }
    }
    
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const response = await room.fetch(new Request("http://internal/deploy", {
      method: "POST",
      body: JSON.stringify({ player, deployments })
    }));
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error("Deploy generals error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 执行游戏操作
export async function executeAction(request: Request, env: Env, gameId: string, player: PlayerSide): Promise<Response> {
  try {
    const body = await request.json() as {
      action: ActionType;
      instance_id?: string;
      target_x?: number;
      target_y?: number;
      target_instance_id?: string;
      skill_target?: string;
    };
    
    const { action, instance_id, target_x, target_y, target_instance_id, skill_target } = body;
    
    // 验证action类型
    const validActions: ActionType[] = ["MOVE", "ATTACK", "SKILL", "WAIT", "RETREAT", "END_TURN"];
    if (!validActions.includes(action)) {
      return Response.json({ success: false, error: { code: 1008, message: "无效操作类型" } }, { status: 400 });
    }
    
    // 根据action类型验证必要参数
    if (action === "MOVE") {
      if (!instance_id || typeof target_x !== "number" || typeof target_y !== "number") {
        return Response.json({ success: false, error: { code: 1000, message: "移动操作需要instance_id和目标坐标" } }, { status: 400 });
      }
    }
    
    if (action === "ATTACK") {
      if (!instance_id || !target_instance_id) {
        return Response.json({ success: false, error: { code: 1000, message: "攻击操作需要instance_id和target_instance_id" } }, { status: 400 });
      }
    }
    
    if (action === "SKILL" || action === "WAIT" || action === "RETREAT") {
      if (!instance_id) {
        return Response.json({ success: false, error: { code: 1000, message: "需要指定武将instance_id" } }, { status: 400 });
      }
    }
    
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const response = await room.fetch(new Request("http://internal/action", {
      method: "POST",
      body: JSON.stringify({
        player,
        action,
        instance_id,
        target_x,
        target_y,
        target_instance_id,
        skill_target
      })
    }));
    
    const data = await response.json() as ApiResponse;
    
    // 记录操作日志
    if (data.success) {
      try {
        // 获取当前回合数（从响应数据中）
        const turn = data.data?.turn || 0;
        await executeUpdate(env, queries.logAction, [
          gameId,
          turn,
          player,
          action,
          JSON.stringify(body),
          JSON.stringify(data.data)
        ]);
      } catch (e) {
        console.error("Failed to log action:", e);
      }
    }
    
    return Response.json(data, { status: data.success ? 200 : 400 });
  } catch (error) {
    console.error("Execute action error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取可移动范围
export async function getMoveableArea(request: Request, env: Env, gameId: string, player: PlayerSide): Promise<Response> {
  try {
    const url = new URL(request.url);
    const instanceId = url.searchParams.get("instance_id");
    
    if (!instanceId) {
      return Response.json({ success: false, error: { code: 1000, message: "缺少instance_id" } }, { status: 400 });
    }
    
    // 获取游戏状态
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const stateResponse = await room.fetch(new Request(`http://internal/state?player=${player}`));
    const stateData = await stateResponse.json() as ApiResponse;
    
    if (!stateData.success || !stateData.data) {
      return Response.json({ success: false, error: { code: 1001, message: "获取游戏状态失败" } }, { status: 400 });
    }
    
    // 这里应该调用movement服务计算可移动范围
    // 简化处理：返回状态供客户端计算
    return Response.json({
      success: true,
      data: { message: "请在客户端根据游戏状态计算可移动范围" }
    });
  } catch (error) {
    console.error("Get moveable area error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取可攻击目标
export async function getAttackTargets(request: Request, env: Env, gameId: string, player: PlayerSide): Promise<Response> {
  try {
    const url = new URL(request.url);
    const instanceId = url.searchParams.get("instance_id");
    
    if (!instanceId) {
      return Response.json({ success: false, error: { code: 1000, message: "缺少instance_id" } }, { status: 400 });
    }
    
    // 获取游戏状态
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const stateResponse = await room.fetch(new Request(`http://internal/state?player=${player}`));
    const stateData = await stateResponse.json() as ApiResponse;
    
    if (!stateData.success || !stateData.data) {
      return Response.json({ success: false, error: { code: 1001, message: "获取游戏状态失败" } }, { status: 400 });
    }
    
    // 这里应该调用combat服务计算可攻击目标
    // 简化处理：返回状态供客户端计算
    return Response.json({
      success: true,
      data: { message: "请在客户端根据游戏状态计算可攻击目标" }
    });
  } catch (error) {
    console.error("Get attack targets error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
