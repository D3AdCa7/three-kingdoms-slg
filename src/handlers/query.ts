import { Env, ApiResponse, PlayerSide, GameStateResponse } from "../types";
import { getGeneralById } from "../data/generals";
import { executeQuery, queries } from "../db/tidb";
import { getVisibleEnemies } from "../services/vision";

// 获取游戏状态
export async function getGameState(request: Request, env: Env, gameId: string, player: PlayerSide): Promise<Response> {
  try {
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    
    const response = await room.fetch(new Request(`http://internal/state?player=${player}`));
    const data = await response.json() as ApiResponse;
    
    if (!data.success || !data.data) {
      return Response.json(data, { status: 400 });
    }
    
    // 格式化响应
    const gameState = data.data;
    const myGenerals = player === "p1" ? gameState.p1_generals : gameState.p2_generals;
    const enemyGenerals = player === "p1" ? gameState.p2_generals : gameState.p1_generals;
    
    // 构造玩家视角的响应
    const formattedResponse: GameStateResponse = {
      game_id: gameState.game_id,
      status: gameState.status,
      turn: gameState.turn,
      current_player: gameState.current_player,
      my_player: player,
      
      my_generals: myGenerals.map((g: any) => {
        const data = getGeneralById(g.general_id);
        return {
          instance_id: g.instance_id,
          general_id: g.general_id,
          name: data?.name || "Unknown",
          current_hp: g.current_hp,
          max_hp: data?.base_hp || 0,
          atk: (data?.base_atk || 0) + g.atk_modifier,
          def: (data?.base_def || 0) + g.def_modifier,
          mov: (data?.base_mov || 0) + g.mov_modifier,
          position: g.position,
          has_acted: g.has_acted,
          buffs: g.buffs.map((b: any) => b.type),
        };
      }),
      
      visible_enemies: enemyGenerals
        .filter((e: any) => e.is_alive)
        .map((e: any) => {
          const data = getGeneralById(e.general_id);
          return {
            instance_id: e.instance_id,
            general_id: e.general_id,
            name: data?.name || "Unknown",
            current_hp: e.current_hp,
            max_hp: data?.base_hp || 0,
            position: e.position,
          };
        }),
      
      city: {
        holder: gameState.city_holder,
        hold_turns: gameState.city_hold_turns,
      },
      
      action_cooldown: {
        can_act: true, // 冷却检查在action handler中处理
        next_action_time: 0,
      },
      
      pick_phase: gameState.pick_phase,
      banned_generals: gameState.banned_generals,
      my_picks: player === "p1" ? gameState.p1_picks : gameState.p2_picks,
      enemy_picks: player === "p1" ? gameState.p2_picks : gameState.p1_picks,
      
      winner: gameState.winner,
      win_reason: gameState.win_reason,
    };
    
    return Response.json({ success: true, data: formattedResponse });
  } catch (error) {
    console.error("Get game state error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取地图数据
export async function getMapData(request: Request, env: Env): Promise<Response> {
  try {
    // 返回地图配置信息
    const mapInfo = {
      width: 100,
      height: 100,
      terrains: {
        plain: { mov_cost: 1, def_bonus: 0 },
        forest: { mov_cost: 2, def_bonus: 1 },
        mountain: { mov_cost: 3, def_bonus: 2 },
        river: { mov_cost: 999, def_bonus: 0 },
        bridge: { mov_cost: 1, def_bonus: 0 },
        road: { mov_cost: 0.5, def_bonus: 0 },
        city: { mov_cost: 1, def_bonus: 2 },
      },
      special_areas: {
        p1_spawn: { x1: 0, y1: 0, x2: 19, y2: 19 },
        p2_spawn: { x1: 80, y1: 80, x2: 99, y2: 99 },
        city_area: { x1: 48, y1: 48, x2: 52, y2: 52 },
        city_gates: [
          { x: 48, y: 50 },
          { x: 52, y: 50 },
          { x: 50, y: 48 },
          { x: 50, y: 52 },
        ],
      },
      rivers: {
        north: { y: 25, bridges: [{ x: 33 }, { x: 66 }] },
        south: { y: 75, bridges: [{ x: 33 }, { x: 66 }] },
      },
    };
    
    return Response.json({ success: true, data: mapInfo });
  } catch (error) {
    console.error("Get map data error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取武将列表
export async function getGeneralsList(request: Request, env: Env): Promise<Response> {
  try {
    const { GENERALS } = await import("../data/generals");
    
    return Response.json({
      success: true,
      data: {
        generals: GENERALS.map(g => ({
          id: g.id,
          name: g.name,
          faction: g.faction,
          type: g.type,
          base_hp: g.base_hp,
          base_atk: g.base_atk,
          base_def: g.base_def,
          base_mov: g.base_mov,
          skill_name: g.skill_name,
          skill_desc: g.skill_desc,
          skill_type: g.skill_type,
        }))
      }
    });
  } catch (error) {
    console.error("Get generals list error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取武将统计
export async function getGeneralStats(request: Request, env: Env): Promise<Response> {
  try {
    const stats = await executeQuery<{
      general_id: number;
      total_picks: number;
      total_wins: number;
      total_bans: number;
      win_rate: number;
    }>(env, queries.getGeneralStats, []);
    
    // 合并武将基本信息
    const { GENERALS } = await import("../data/generals");
    const statsWithInfo = stats.map(s => {
      const general = GENERALS.find(g => g.id === s.general_id);
      return {
        ...s,
        name: general?.name || "Unknown",
        faction: general?.faction || "Unknown",
      };
    });
    
    return Response.json({
      success: true,
      data: { stats: statsWithInfo }
    });
  } catch (error) {
    console.error("Get general stats error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取对局回放
export async function getGameReplay(request: Request, env: Env, gameId: string): Promise<Response> {
  try {
    // 获取游戏信息
    const games = await executeQuery<any>(env, queries.getGame, [gameId]);
    
    if (games.length === 0) {
      return Response.json({ success: false, error: { code: 1001, message: "游戏不存在" } }, { status: 404 });
    }
    
    const game = games[0];
    
    // 获取操作日志
    const actionLogs = await executeQuery<{
      turn: number;
      player: string;
      action_type: string;
      action_data: string;
      result: string;
      created_at: string;
    }>(env, queries.getActionLogs, [gameId]);
    
    return Response.json({
      success: true,
      data: {
        game: {
          id: game.id,
          p1_name: game.p1_name,
          p2_name: game.p2_name,
          winner: game.winner,
          win_reason: game.win_reason,
          total_turns: game.total_turns,
          p1_generals: game.p1_generals,
          p2_generals: game.p2_generals,
          banned_generals: game.banned_generals,
        },
        actions: actionLogs.map(log => ({
          turn: log.turn,
          player: log.player,
          action_type: log.action_type,
          action_data: typeof log.action_data === "string" ? JSON.parse(log.action_data) : log.action_data,
          result: typeof log.result === "string" ? JSON.parse(log.result) : log.result,
          timestamp: log.created_at,
        }))
      }
    });
  } catch (error) {
    console.error("Get game replay error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 获取选将阶段信息
export async function getPickPhaseInfo(request: Request, env: Env): Promise<Response> {
  try {
    const { PICK_ORDER } = await import("../types");
    
    return Response.json({
      success: true,
      data: {
        phases: PICK_ORDER,
        description: {
          total_phases: 10,
          bans_per_player: 2,
          picks_per_player: 5,
        }
      }
    });
  } catch (error) {
    console.error("Get pick phase info error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}

// 健康检查
export async function healthCheck(request: Request, env: Env): Promise<Response> {
  return Response.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || "development",
    }
  });
}
