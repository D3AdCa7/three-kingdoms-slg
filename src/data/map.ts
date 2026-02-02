import { MapData, TerrainType, Position, Area } from "../types";

// 地图尺寸
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 20;

// 地形定义 - 移除不可通行地形，改用减速地形
export const TERRAIN_CONFIG: Record<TerrainType, { mov_cost: number; def_bonus: number }> = {
  plain: { mov_cost: 1, def_bonus: 0 },
  forest: { mov_cost: 1.5, def_bonus: 1 },
  mountain: { mov_cost: 2, def_bonus: 2 },
  river: { mov_cost: 1.5, def_bonus: 0 }, // 改为减速地形（浅滩），不再不可通行
  bridge: { mov_cost: 1, def_bonus: 0 },
  road: { mov_cost: 0.5, def_bonus: 0 },
  city: { mov_cost: 1, def_bonus: 2 },
};

// 关键区域定义 - 缩小到 20x20 地图
export const P1_SPAWN: Area = { x1: 0, y1: 0, x2: 3, y2: 3 };
export const P2_SPAWN: Area = { x1: 16, y1: 16, x2: 19, y2: 19 };
export const CITY_AREA: Area = { x1: 8, y1: 8, x2: 11, y2: 11 };
export const CITY_GATES: Position[] = [
  { x: 8, y: 9 },   // 西门
  { x: 8, y: 10 },  // 西门2
  { x: 11, y: 9 },  // 东门
  { x: 11, y: 10 }, // 东门2
  { x: 9, y: 8 },   // 北门
  { x: 10, y: 8 },  // 北门2
  { x: 9, y: 11 },  // 南门
  { x: 10, y: 11 }, // 南门2
];

// 生成 20x20 地图
function generateTerrains(): TerrainType[][] {
  const terrains: TerrainType[][] = [];
  
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push(getTerrainAt(x, y));
    }
    terrains.push(row);
  }
  
  return terrains;
}

// 根据坐标获取地形类型
function getTerrainAt(x: number, y: number): TerrainType {
  // 中央城池 (8-11, 8-11)
  if (isInArea(x, y, CITY_AREA)) {
    return "city";
  }
  
  // 主要道路 - 从出生区通向城池
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
  // 横向主道路 - y=9或10 从x=0到x=19（城池外）
  if ((y === 9 || y === 10) && (x < 8 || x > 11)) {
    return true;
  }
  
  // 纵向主道路 - x=9或10 从y=0到y=19（城池外）
  if ((x === 9 || x === 10) && (y < 8 || y > 11)) {
    return true;
  }
  
  // 对角线道路 - P1 到城池
  if (x === y && x < 8) {
    return true;
  }
  
  // 对角线道路 - P2 到城池
  if (x === y && x > 11) {
    return true;
  }
  
  return false;
}

// 城池周围的环形道路
function isCityRingRoad(x: number, y: number): boolean {
  // 城池外围一圈 (7,7) 到 (12,12) 但不包括城池本身
  if (x >= 7 && x <= 12 && y >= 7 && y <= 12) {
    if (x === 7 || x === 12 || y === 7 || y === 12) {
      // 排除城池内部
      if (!isInArea(x, y, CITY_AREA)) {
        return true;
      }
    }
  }
  return false;
}

// 使用简单哈希生成确定性的树林分布
function isForest(x: number, y: number): boolean {
  // 排除特殊区域
  if (isInArea(x, y, P1_SPAWN)) return false;
  if (isInArea(x, y, P2_SPAWN)) return false;
  if (isInArea(x, y, { x1: 6, y1: 6, x2: 13, y2: 13 })) return false; // 城池周围
  if (isOnMainRoad(x, y) || isCityRingRoad(x, y)) return false;
  
  // 伪随机确定性分布，约12%覆盖率
  const hash = simpleHash(x, y, 1);
  return hash % 100 < 12;
}

// 使用简单哈希生成确定性的山地分布
function isMountain(x: number, y: number): boolean {
  // 排除特殊区域
  if (isInArea(x, y, P1_SPAWN)) return false;
  if (isInArea(x, y, P2_SPAWN)) return false;
  if (isInArea(x, y, { x1: 5, y1: 5, x2: 14, y2: 14 })) return false; // 城池更大范围
  if (isOnMainRoad(x, y) || isCityRingRoad(x, y)) return false;
  if (isForest(x, y)) return false;
  
  // 山地分布在地图边缘区域，约8%覆盖率
  const hash = simpleHash(x, y, 2);
  return hash % 100 < 8;
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
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  terrains: MAP_TERRAINS,
  p1_spawn: P1_SPAWN,
  p2_spawn: P2_SPAWN,
  city_area: CITY_AREA,
  city_gates: CITY_GATES,
};

// 获取指定位置的地形
export function getTerrain(x: number, y: number): { type: TerrainType; mov_cost: number; def_bonus: number } {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return { type: "mountain", mov_cost: 999, def_bonus: 0 }; // 地图外视为不可通行
  }
  const type = MAP_TERRAINS[y][x];
  return {
    type,
    ...TERRAIN_CONFIG[type],
  };
}

// 检查位置是否可通行 - 现在所有地图内位置都可通行
export function isPassable(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return false;
  }
  return true; // 所有地图内的位置都可通行
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
  ].filter(p => p.x >= 0 && p.x < MAP_WIDTH && p.y >= 0 && p.y < MAP_HEIGHT);
}

// 获取八方向相邻格子（包括斜向）
export function getDiagonalAdjacentPositions(pos: Position): Position[] {
  const positions: Position[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        positions.push({ x: nx, y: ny });
      }
    }
  }
  return positions;
}

// 导出地图字符串表示（调试用）
export function getMapString(centerX: number, centerY: number, radius: number = 5): string {
  const symbols: Record<TerrainType, string> = {
    plain: ".",
    forest: "🌲",
    mountain: "🏔",
    river: "~",
    bridge: "🌉",
    road: "═",
    city: "🏯",
  };
  
  let result = "";
  const startY = Math.max(0, centerY - radius);
  const endY = Math.min(MAP_HEIGHT - 1, centerY + radius);
  const startX = Math.max(0, centerX - radius);
  const endX = Math.min(MAP_WIDTH - 1, centerX + radius);
  
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      result += symbols[MAP_TERRAINS[y][x]];
    }
    result += "\n";
  }
  
  return result;
}

// 获取完整地图字符串
export function getFullMapString(): string {
  const symbols: Record<TerrainType, string> = {
    plain: ".",
    forest: "F",
    mountain: "M",
    river: "~",
    bridge: "=",
    road: "#",
    city: "C",
  };
  
  let result = "   ";
  // 列号
  for (let x = 0; x < MAP_WIDTH; x++) {
    result += (x % 10).toString();
  }
  result += "\n";
  
  for (let y = 0; y < MAP_HEIGHT; y++) {
    result += y.toString().padStart(2, " ") + " ";
    for (let x = 0; x < MAP_WIDTH; x++) {
      result += symbols[MAP_TERRAINS[y][x]];
    }
    result += "\n";
  }
  
  return result;
}
