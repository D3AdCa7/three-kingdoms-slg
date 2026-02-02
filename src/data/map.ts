import { MapData, TerrainType, Position, Area } from "../types";

// 地形定义
export const TERRAIN_CONFIG: Record<TerrainType, { mov_cost: number; def_bonus: number }> = {
  plain: { mov_cost: 1, def_bonus: 0 },
  forest: { mov_cost: 2, def_bonus: 1 },
  mountain: { mov_cost: 3, def_bonus: 2 },
  river: { mov_cost: 999, def_bonus: 0 }, // 不可通行
  bridge: { mov_cost: 1, def_bonus: 0 },
  road: { mov_cost: 0.5, def_bonus: 0 },
  city: { mov_cost: 1, def_bonus: 2 },
};

// 关键区域定义
export const P1_SPAWN: Area = { x1: 0, y1: 0, x2: 19, y2: 19 };
export const P2_SPAWN: Area = { x1: 80, y1: 80, x2: 99, y2: 99 };
export const CITY_AREA: Area = { x1: 48, y1: 48, x2: 52, y2: 52 };
export const CITY_GATES: Position[] = [
  { x: 48, y: 50 }, // 西门
  { x: 52, y: 50 }, // 东门
  { x: 50, y: 48 }, // 北门
  { x: 50, y: 52 }, // 南门
];

// 河流位置
export const NORTH_RIVER_Y = 25;
export const SOUTH_RIVER_Y = 75;

// 桥梁位置
export const BRIDGES: Position[] = [
  { x: 33, y: 25 }, // 北桥1
  { x: 66, y: 25 }, // 北桥2
  { x: 33, y: 75 }, // 南桥1
  { x: 66, y: 75 }, // 南桥2
];

// 生成100x100地图
function generateTerrains(): TerrainType[][] {
  const terrains: TerrainType[][] = [];
  
  for (let y = 0; y < 100; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < 100; x++) {
      row.push(getTerrainAt(x, y));
    }
    terrains.push(row);
  }
  
  return terrains;
}

// 根据坐标获取地形类型
function getTerrainAt(x: number, y: number): TerrainType {
  // 中央城池 (48-52, 48-52)
  if (isInArea(x, y, CITY_AREA)) {
    return "city";
  }
  
  // 河流 - y=25 和 y=75
  if (y === NORTH_RIVER_Y || y === SOUTH_RIVER_Y) {
    // 检查是否是桥梁位置
    if (BRIDGES.some(b => b.x === x && b.y === y)) {
      return "bridge";
    }
    return "river";
  }
  
  // 主要道路 - 从出生区到城池
  // P1道路: 从(10,10)斜向到城池
  // P2道路: 从(90,90)斜向到城池
  if (isOnMainRoad(x, y)) {
    return "road";
  }
  
  // 城池周围的道路环
  if (isCityRingRoad(x, y)) {
    return "road";
  }
  
  // 随机分布的树林（使用确定性算法保证一致性）
  if (isForest(x, y)) {
    return "forest";
  }
  
  // 随机分布的山地
  if (isMountain(x, y)) {
    return "mountain";
  }
  
  // 默认平原
  return "plain";
}

// 检查是否在某区域内
export function isInArea(x: number, y: number, area: Area): boolean {
  return x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2;
}

// 检查是否在主要道路上
function isOnMainRoad(x: number, y: number): boolean {
  // 横向主道路 - y=50 从x=0到x=100
  if (y === 50 && (x < 48 || x > 52)) {
    return true;
  }
  
  // 纵向主道路 - x=50 从y=0到y=100
  if (x === 50 && (y < 48 || y > 52)) {
    return true;
  }
  
  // 对角线道路
  // P1方向: 从左下到城池
  if (Math.abs(x - y) <= 1 && x < 48 && y < 48 && x >= 10 && y >= 10) {
    return true;
  }
  
  // P2方向: 从右上到城池
  if (Math.abs((99 - x) - (99 - y)) <= 1 && x > 52 && y > 52 && x <= 90 && y <= 90) {
    return true;
  }
  
  return false;
}

// 城池周围的环形道路
function isCityRingRoad(x: number, y: number): boolean {
  // 城池外围一圈 (47,47) 到 (53,53) 但不包括城池本身
  if (x >= 47 && x <= 53 && y >= 47 && y <= 53) {
    if (x === 47 || x === 53 || y === 47 || y === 53) {
      return true;
    }
  }
  return false;
}

// 使用简单哈希生成确定性的树林分布
function isForest(x: number, y: number): boolean {
  // 排除特殊区域
  if (isInArea(x, y, P1_SPAWN) || isInArea(x, y, P2_SPAWN)) return false;
  if (isInArea(x, y, { x1: 45, y1: 45, x2: 55, y2: 55 })) return false; // 城池周围
  if (y === NORTH_RIVER_Y || y === SOUTH_RIVER_Y) return false;
  if (isOnMainRoad(x, y) || isCityRingRoad(x, y)) return false;
  
  // 伪随机确定性分布，约15%覆盖率
  const hash = simpleHash(x, y, 1);
  return hash % 100 < 15;
}

// 使用简单哈希生成确定性的山地分布
function isMountain(x: number, y: number): boolean {
  // 排除特殊区域
  if (isInArea(x, y, P1_SPAWN) || isInArea(x, y, P2_SPAWN)) return false;
  if (isInArea(x, y, { x1: 43, y1: 43, x2: 57, y2: 57 })) return false; // 城池更大范围
  if (y === NORTH_RIVER_Y || y === SOUTH_RIVER_Y) return false;
  if (isOnMainRoad(x, y) || isCityRingRoad(x, y)) return false;
  if (isForest(x, y)) return false;
  
  // 山地主要分布在地图四角和中间区域的特定位置
  // 约8%覆盖率
  const hash = simpleHash(x, y, 2);
  
  // 四角区域更多山地
  const inCornerRegion = 
    (x < 30 && y > 30 && y < 70) || // 左侧
    (x > 70 && y > 30 && y < 70) || // 右侧
    (y < 30 && x > 30 && x < 70) || // 上侧
    (y > 70 && x > 30 && x < 70);   // 下侧
  
  if (inCornerRegion) {
    return hash % 100 < 12;
  }
  
  return hash % 100 < 5;
}

// 简单哈希函数用于确定性随机
function simpleHash(x: number, y: number, seed: number): number {
  let h = seed;
  h = ((h << 5) + h) + x;
  h = ((h << 5) + h) + y;
  h = h ^ (h >> 16);
  h = Math.abs(h);
  return h;
}

// 预生成地图数据
const MAP_TERRAINS = generateTerrains();

// 导出地图数据
export const MAP_DATA: MapData = {
  width: 100,
  height: 100,
  terrains: MAP_TERRAINS,
  p1_spawn: P1_SPAWN,
  p2_spawn: P2_SPAWN,
  city_area: CITY_AREA,
  city_gates: CITY_GATES,
};

// 获取指定位置的地形
export function getTerrain(x: number, y: number): { type: TerrainType; mov_cost: number; def_bonus: number } {
  if (x < 0 || x >= 100 || y < 0 || y >= 100) {
    return { type: "river", mov_cost: 999, def_bonus: 0 }; // 地图外视为不可通行
  }
  const type = MAP_TERRAINS[y][x];
  return {
    type,
    ...TERRAIN_CONFIG[type],
  };
}

// 检查位置是否可通行
export function isPassable(x: number, y: number): boolean {
  const terrain = getTerrain(x, y);
  return terrain.mov_cost < 999;
}

// 检查是否是城池区域
export function isInCity(x: number, y: number): boolean {
  return isInArea(x, y, CITY_AREA);
}

// 检查是否是城门
export function isCityGate(x: number, y: number): boolean {
  return CITY_GATES.some(g => g.x === x && g.y === y);
}

// 获取P1或P2的出生区
export function getSpawnArea(player: "p1" | "p2"): Area {
  return player === "p1" ? P1_SPAWN : P2_SPAWN;
}

// 计算两点之间的曼哈顿距离
export function manhattanDistance(p1: Position, p2: Position): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

// 获取相邻格子（上下左右）
export function getAdjacentPositions(pos: Position): Position[] {
  return [
    { x: pos.x - 1, y: pos.y },
    { x: pos.x + 1, y: pos.y },
    { x: pos.x, y: pos.y - 1 },
    { x: pos.x, y: pos.y + 1 },
  ].filter(p => p.x >= 0 && p.x < 100 && p.y >= 0 && p.y < 100);
}

// 获取八方向相邻格子（包括斜向）
export function getDiagonalAdjacentPositions(pos: Position): Position[] {
  const positions: Position[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      if (nx >= 0 && nx < 100 && ny >= 0 && ny < 100) {
        positions.push({ x: nx, y: ny });
      }
    }
  }
  return positions;
}

// 导出地图字符串表示（调试用）
export function getMapString(centerX: number, centerY: number, radius: number = 10): string {
  const symbols: Record<TerrainType, string> = {
    plain: ".",
    forest: "🌲",
    mountain: "🏔",
    river: "🌊",
    bridge: "🌉",
    road: "═",
    city: "🏯",
  };
  
  let result = "";
  const startY = Math.max(0, centerY - radius);
  const endY = Math.min(99, centerY + radius);
  const startX = Math.max(0, centerX - radius);
  const endX = Math.min(99, centerX + radius);
  
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      result += symbols[MAP_TERRAINS[y][x]];
    }
    result += "\n";
  }
  
  return result;
}
