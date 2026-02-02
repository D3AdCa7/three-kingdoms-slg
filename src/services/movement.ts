import { BattleGeneral, GameState, Position, Direction } from "../types";
import { getGeneralById } from "../data/generals";
import {
  getTerrain,
  isPassable,
  manhattanDistance,
  getAdjacentPositions,
  getDiagonalAdjacentPositions,
} from "../data/map";
import { canMoveDiagonally, canPassThroughEnemy } from "./skill";

// 路径节点
interface PathNode {
  x: number;
  y: number;
  cost: number; // 到达此点的总移动消耗
  parent: PathNode | null;
}

// 可移动范围结果
export interface MoveableArea {
  positions: Position[];
  costs: Map<string, number>; // position key -> cost
}

// 计算武将可移动的范围
export function getMoveableArea(
  general: BattleGeneral,
  gameState: GameState
): MoveableArea {
  const data = getGeneralById(general.general_id);
  if (!data) {
    return { positions: [], costs: new Map() };
  }
  
  const maxMov = data.base_mov + general.mov_modifier;
  const canDiagonal = canMoveDiagonally(general);
  const canPassEnemy = canPassThroughEnemy(general);
  
  // 获取所有单位位置
  const occupiedPositions = getOccupiedPositions(gameState, general.instance_id);
  const enemyPositions = getEnemyPositions(general.owner, gameState);
  
  // BFS搜索可达位置
  const visited = new Map<string, number>(); // position key -> min cost
  const queue: PathNode[] = [{
    x: general.position.x,
    y: general.position.y,
    cost: 0,
    parent: null,
  }];
  
  visited.set(posKey(general.position), 0);
  const reachable: Position[] = [];
  const costs = new Map<string, number>();
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // 获取可移动的相邻格子
    const neighbors = canDiagonal
      ? getDiagonalAdjacentPositions({ x: current.x, y: current.y })
      : getAdjacentPositions({ x: current.x, y: current.y });
    
    for (const neighbor of neighbors) {
      // 检查是否可通行
      if (!isPassable(neighbor.x, neighbor.y)) continue;
      
      // 计算移动消耗
      const terrain = getTerrain(neighbor.x, neighbor.y);
      let moveCost = terrain.mov_cost;
      
      // 斜向移动消耗额外0.5
      if (canDiagonal && current.x !== neighbor.x && current.y !== neighbor.y) {
        moveCost *= 1.4; // 斜向移动距离约1.4倍
      }
      
      const totalCost = current.cost + moveCost;
      
      // 检查是否超出移动力
      if (totalCost > maxMov) continue;
      
      const key = posKey(neighbor);
      
      // 检查是否已访问过且代价更低
      if (visited.has(key) && visited.get(key)! <= totalCost) continue;
      
      // 检查是否被占用
      const isOccupied = occupiedPositions.has(key);
      const isEnemyPos = enemyPositions.has(key);
      
      // 吕蒙白衣可以穿越敌人，但不能停留
      if (isOccupied && !isEnemyPos) continue; // 友军位置不能通过
      if (isEnemyPos && !canPassEnemy) continue; // 敌军位置需要白衣技能
      
      visited.set(key, totalCost);
      
      // 只有非占用位置才可以作为终点
      if (!isOccupied) {
        reachable.push({ x: neighbor.x, y: neighbor.y });
        costs.set(key, totalCost);
      }
      
      // 继续搜索（即使是敌人位置也要继续，因为可能穿越）
      queue.push({
        x: neighbor.x,
        y: neighbor.y,
        cost: totalCost,
        parent: current,
      });
    }
  }
  
  return { positions: reachable, costs };
}

// 计算移动路径
export function findPath(
  general: BattleGeneral,
  target: Position,
  gameState: GameState
): Position[] | null {
  const data = getGeneralById(general.general_id);
  if (!data) return null;
  
  const maxMov = data.base_mov + general.mov_modifier;
  const canDiagonal = canMoveDiagonally(general);
  const canPassEnemy = canPassThroughEnemy(general);
  
  // 获取所有单位位置
  const occupiedPositions = getOccupiedPositions(gameState, general.instance_id);
  const enemyPositions = getEnemyPositions(general.owner, gameState);
  
  // 检查目标是否被占用
  if (occupiedPositions.has(posKey(target))) {
    return null;
  }
  
  // A*搜索
  const openSet: PathNode[] = [{
    x: general.position.x,
    y: general.position.y,
    cost: 0,
    parent: null,
  }];
  
  const closedSet = new Set<string>();
  const gScore = new Map<string, number>();
  gScore.set(posKey(general.position), 0);
  
  while (openSet.length > 0) {
    // 按f值排序（g + h）
    openSet.sort((a, b) => {
      const fA = a.cost + manhattanDistance({ x: a.x, y: a.y }, target);
      const fB = b.cost + manhattanDistance({ x: b.x, y: b.y }, target);
      return fA - fB;
    });
    
    const current = openSet.shift()!;
    const currentKey = posKey({ x: current.x, y: current.y });
    
    // 到达目标
    if (current.x === target.x && current.y === target.y) {
      return reconstructPath(current);
    }
    
    closedSet.add(currentKey);
    
    // 获取邻居
    const neighbors = canDiagonal
      ? getDiagonalAdjacentPositions({ x: current.x, y: current.y })
      : getAdjacentPositions({ x: current.x, y: current.y });
    
    for (const neighbor of neighbors) {
      const neighborKey = posKey(neighbor);
      
      if (closedSet.has(neighborKey)) continue;
      if (!isPassable(neighbor.x, neighbor.y)) continue;
      
      // 计算移动消耗
      const terrain = getTerrain(neighbor.x, neighbor.y);
      let moveCost = terrain.mov_cost;
      
      if (canDiagonal && current.x !== neighbor.x && current.y !== neighbor.y) {
        moveCost *= 1.4;
      }
      
      const tentativeG = current.cost + moveCost;
      
      // 检查是否超出移动力
      if (tentativeG > maxMov) continue;
      
      // 检查占用
      const isOccupied = occupiedPositions.has(neighborKey);
      const isEnemyPos = enemyPositions.has(neighborKey);
      
      // 最终目标不能是占用位置
      if (neighbor.x === target.x && neighbor.y === target.y && isOccupied) continue;
      
      // 中间路径：友军不能穿越，敌军需要白衣
      if (isOccupied && !isEnemyPos) continue;
      if (isEnemyPos && !canPassEnemy) continue;
      
      // 更好的路径
      if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)!) {
        gScore.set(neighborKey, tentativeG);
        
        const existingIndex = openSet.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);
        const newNode: PathNode = {
          x: neighbor.x,
          y: neighbor.y,
          cost: tentativeG,
          parent: current,
        };
        
        if (existingIndex >= 0) {
          openSet[existingIndex] = newNode;
        } else {
          openSet.push(newNode);
        }
      }
    }
  }
  
  return null; // 无法到达
}

// 重建路径
function reconstructPath(node: PathNode): Position[] {
  const path: Position[] = [];
  let current: PathNode | null = node;
  
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  
  return path;
}

// 执行移动
export function executeMove(
  general: BattleGeneral,
  target: Position,
  gameState: GameState
): { success: boolean; path?: Position[]; error?: string } {
  // 检查是否已行动
  if (general.has_acted) {
    return { success: false, error: "武将已行动" };
  }
  
  // 检查是否存活
  if (!general.is_alive) {
    return { success: false, error: "武将已阵亡" };
  }
  
  // 计算路径
  const path = findPath(general, target, gameState);
  if (!path) {
    return { success: false, error: "目标位置不可达" };
  }
  
  // 计算实际移动距离
  const moveArea = getMoveableArea(general, gameState);
  const targetKey = posKey(target);
  
  if (!moveArea.costs.has(targetKey)) {
    return { success: false, error: "目标超出移动范围" };
  }
  
  // 执行移动
  const startPos = { ...general.position };
  general.position = target;
  
  // 记录移动距离（用于马超铁骑技能）
  general.moved_distance = (general.moved_distance || 0) + manhattanDistance(startPos, target);
  
  // 更新面朝方向
  if (path.length >= 2) {
    const lastMove = path[path.length - 1];
    const secondLast = path[path.length - 2];
    updateFacingFromMove(general, secondLast, lastMove);
  }
  
  return { success: true, path };
}

// 赵云龙胆额外移动
export function executeExtraMove(
  general: BattleGeneral,
  target: Position,
  gameState: GameState
): { success: boolean; path?: Position[]; error?: string } {
  // 检查是否有额外移动机会
  const extraMove = general.skill_state.extra_move;
  if (!extraMove || extraMove <= 0) {
    return { success: false, error: "没有额外移动机会" };
  }
  
  // 临时增加移动力
  const originalMod = general.mov_modifier;
  general.mov_modifier = extraMove - (getGeneralById(general.general_id)?.base_mov || 0);
  
  const path = findPath(general, target, gameState);
  
  // 恢复原始移动力
  general.mov_modifier = originalMod;
  
  if (!path) {
    return { success: false, error: "目标位置不可达" };
  }
  
  const distance = manhattanDistance(general.position, target);
  if (distance > extraMove) {
    return { success: false, error: "超出额外移动距离" };
  }
  
  // 执行移动
  general.position = target;
  general.skill_state.extra_move = 0;
  
  return { success: true, path };
}

// 根据移动方向更新面朝
function updateFacingFromMove(general: BattleGeneral, from: Position, to: Position): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  if (dx > 0) general.facing = "right";
  else if (dx < 0) general.facing = "left";
  else if (dy > 0) general.facing = "down";
  else if (dy < 0) general.facing = "up";
}

// 获取所有被占用的位置
function getOccupiedPositions(gameState: GameState, excludeId?: string): Set<string> {
  const positions = new Set<string>();
  
  for (const general of [...gameState.p1_generals, ...gameState.p2_generals]) {
    if (!general.is_alive) continue;
    if (excludeId && general.instance_id === excludeId) continue;
    positions.add(posKey(general.position));
  }
  
  return positions;
}

// 获取敌方位置
function getEnemyPositions(myOwner: string, gameState: GameState): Set<string> {
  const enemies = myOwner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  const positions = new Set<string>();
  
  for (const enemy of enemies) {
    if (enemy.is_alive) {
      positions.add(posKey(enemy.position));
    }
  }
  
  return positions;
}

// 位置键值
function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

// 检查位置是否可以移动到
export function canMoveTo(
  general: BattleGeneral,
  target: Position,
  gameState: GameState
): { canMove: boolean; reason?: string } {
  if (!general.is_alive) {
    return { canMove: false, reason: "武将已阵亡" };
  }
  
  if (general.has_acted) {
    return { canMove: false, reason: "武将已行动" };
  }
  
  if (!isPassable(target.x, target.y)) {
    return { canMove: false, reason: "目标位置不可通行" };
  }
  
  // 检查是否被占用
  const occupiedPositions = getOccupiedPositions(gameState, general.instance_id);
  if (occupiedPositions.has(posKey(target))) {
    return { canMove: false, reason: "目标位置已被占用" };
  }
  
  // 检查是否在移动范围内
  const moveArea = getMoveableArea(general, gameState);
  if (!moveArea.costs.has(posKey(target))) {
    return { canMove: false, reason: "目标超出移动范围" };
  }
  
  return { canMove: true };
}

// 获取有效移动力
export function getEffectiveMovement(general: BattleGeneral): number {
  const data = getGeneralById(general.general_id);
  if (!data) return 0;
  return data.base_mov + general.mov_modifier;
}
