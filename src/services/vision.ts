import { BattleGeneral, GameState, Position, PlayerSide } from "../types";
import { getGeneralById } from "../data/generals";
import { getTerrain, manhattanDistance, isInArea, CITY_AREA } from "../data/map";

// 视野配置
const BASE_VISION_RANGE = 5; // 基础视野范围
const FOREST_VISION_PENALTY = 2; // 树林减少视野
const MOUNTAIN_VISION_BONUS = 2; // 山地增加视野
const CITY_VISION_BONUS = 3; // 城池增加视野

// 计算武将的视野范围
export function getVisionRange(general: BattleGeneral): number {
  const data = getGeneralById(general.general_id);
  if (!data) return BASE_VISION_RANGE;
  
  let range = BASE_VISION_RANGE;
  
  // 根据武将类型调整
  switch (data.type) {
    case "弓手":
      range += 2; // 弓手视野更远
      break;
    case "谋士":
      range += 1; // 谋士视野稍远
      break;
    case "骑兵":
      range += 1; // 骑兵视野稍远
      break;
  }
  
  // 根据当前地形调整
  const terrain = getTerrain(general.position.x, general.position.y);
  switch (terrain.type) {
    case "mountain":
      range += MOUNTAIN_VISION_BONUS;
      break;
    case "city":
      range += CITY_VISION_BONUS;
      break;
    case "forest":
      // 在树林中不减少自己的视野，只影响被发现
      break;
  }
  
  return range;
}

// 检查位置是否在视野内
export function isInVision(
  observer: BattleGeneral,
  target: Position,
  gameState: GameState
): boolean {
  const visionRange = getVisionRange(observer);
  const distance = manhattanDistance(observer.position, target);
  
  // 基础距离检查
  if (distance > visionRange) {
    return false;
  }
  
  // 检查目标地形是否提供隐蔽
  const targetTerrain = getTerrain(target.x, target.y);
  if (targetTerrain.type === "forest") {
    // 树林中的单位更难被发现，需要更近的距离
    return distance <= visionRange - FOREST_VISION_PENALTY;
  }
  
  return true;
}

// 获取玩家可见的敌方单位
export function getVisibleEnemies(
  player: PlayerSide,
  gameState: GameState
): BattleGeneral[] {
  const myGenerals = player === "p1" ? gameState.p1_generals : gameState.p2_generals;
  const enemyGenerals = player === "p1" ? gameState.p2_generals : gameState.p1_generals;
  
  const visibleEnemies: BattleGeneral[] = [];
  
  for (const enemy of enemyGenerals) {
    if (!enemy.is_alive) continue;
    
    // 检查是否被任何友军看到
    let isVisible = false;
    for (const ally of myGenerals) {
      if (!ally.is_alive) continue;
      if (isInVision(ally, enemy.position, gameState)) {
        isVisible = true;
        break;
      }
    }
    
    if (isVisible) {
      visibleEnemies.push(enemy);
    }
  }
  
  return visibleEnemies;
}

// 获取玩家的完整视野区域
export function getPlayerVisionArea(
  player: PlayerSide,
  gameState: GameState
): Set<string> {
  const myGenerals = player === "p1" ? gameState.p1_generals : gameState.p2_generals;
  const visibleArea = new Set<string>();
  
  for (const general of myGenerals) {
    if (!general.is_alive) continue;
    
    const visionRange = getVisionRange(general);
    const positions = getVisiblePositionsFrom(general.position, visionRange);
    
    for (const pos of positions) {
      visibleArea.add(`${pos.x},${pos.y}`);
    }
  }
  
  // 城池区域始终可见（如果控制城池）
  if (gameState.city_holder === player) {
    for (let x = CITY_AREA.x1; x <= CITY_AREA.x2; x++) {
      for (let y = CITY_AREA.y1; y <= CITY_AREA.y2; y++) {
        visibleArea.add(`${x},${y}`);
      }
    }
  }
  
  return visibleArea;
}

// 从某个位置获取所有可见位置
function getVisiblePositionsFrom(center: Position, range: number): Position[] {
  const positions: Position[] = [];
  
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      const x = center.x + dx;
      const y = center.y + dy;
      
      // 边界检查
      if (x < 0 || x >= 100 || y < 0 || y >= 100) continue;
      
      // 曼哈顿距离检查
      if (Math.abs(dx) + Math.abs(dy) > range) continue;
      
      positions.push({ x, y });
    }
  }
  
  return positions;
}

// 过滤游戏状态，只包含玩家可见的信息
export function filterGameStateForPlayer(
  gameState: GameState,
  player: PlayerSide
): Partial<GameState> {
  const visibleEnemies = getVisibleEnemies(player, gameState);
  const myGenerals = player === "p1" ? gameState.p1_generals : gameState.p2_generals;
  const enemyGenerals = player === "p1" ? gameState.p2_generals : gameState.p1_generals;
  
  // 创建过滤后的敌方武将列表（只包含可见的）
  const filteredEnemies = enemyGenerals.map(enemy => {
    const isVisible = visibleEnemies.some(v => v.instance_id === enemy.instance_id);
    
    if (isVisible) {
      // 可见敌人：返回基本信息（不含技能状态等敏感信息）
      return {
        ...enemy,
        skill_state: {}, // 隐藏技能状态
        buffs: enemy.buffs.filter(b => b.type !== "burn" || true), // 灼烧可见
      };
    } else {
      // 不可见敌人：返回null或隐藏位置
      return null;
    }
  }).filter(e => e !== null) as BattleGeneral[];
  
  return {
    ...gameState,
    p1_generals: player === "p1" ? myGenerals : filteredEnemies,
    p2_generals: player === "p2" ? myGenerals : filteredEnemies,
  };
}

// 郭嘉鬼才技能 - 获取视野范围内敌人的信息
export function getEnhancedVisionInfo(
  guojia: BattleGeneral,
  gameState: GameState
): { enemy: BattleGeneral; detailedInfo: boolean }[] {
  const data = getGeneralById(guojia.general_id);
  if (data?.skill_name !== "鬼才") return [];
  
  const enemies = guojia.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  const result: { enemy: BattleGeneral; detailedInfo: boolean }[] = [];
  
  for (const enemy of enemies) {
    if (!enemy.is_alive) continue;
    
    const distance = manhattanDistance(guojia.position, enemy.position);
    
    // 5格范围内可以看到详细信息
    if (distance <= 5) {
      result.push({ enemy, detailedInfo: true });
    } else if (isInVision(guojia, enemy.position, gameState)) {
      result.push({ enemy, detailedInfo: false });
    }
  }
  
  return result;
}

// 检查是否有任何敌人在某个位置的视野内
export function isPositionObservedByEnemy(
  position: Position,
  myOwner: PlayerSide,
  gameState: GameState
): boolean {
  const enemies = myOwner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  
  for (const enemy of enemies) {
    if (!enemy.is_alive) continue;
    if (isInVision(enemy, position, gameState)) {
      return true;
    }
  }
  
  return false;
}

// 获取安全移动位置（不在敌方视野内）
export function getSafePositions(
  general: BattleGeneral,
  moveablePositions: Position[],
  gameState: GameState
): Position[] {
  return moveablePositions.filter(pos => 
    !isPositionObservedByEnemy(pos, general.owner, gameState)
  );
}

// 计算视野覆盖统计
export function getVisionCoverageStats(
  player: PlayerSide,
  gameState: GameState
): { total: number; percentage: number } {
  const visionArea = getPlayerVisionArea(player, gameState);
  const total = visionArea.size;
  const percentage = (total / 10000) * 100; // 100x100 = 10000
  
  return { total, percentage };
}
