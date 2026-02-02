// 环境类型定义
export interface Env {
  GAME_ROOM: DurableObjectNamespace;
  TIDB_HOST: string;
  TIDB_USER: string;
  TIDB_PASSWORD: string;
  TIDB_DATABASE: string;
  ENVIRONMENT: string;
}

// 阵营类型
export type Faction = "蜀" | "魏" | "吴" | "群";

// 武将类型
export type GeneralType = "猛将" | "骑兵" | "谋士" | "弓手" | "守将" | "刺客" | "均衡" | "君主";

// 技能类型
export type SkillType = "passive" | "active";

// 武将定义
export interface General {
  id: number;
  name: string;
  faction: Faction;
  type: GeneralType;
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_mov: number;
  skill_name: string;
  skill_desc: string;
  skill_type: SkillType;
}

// 玩家标识
export type PlayerSide = "p1" | "p2";

// 方向
export type Direction = "up" | "down" | "left" | "right";

// Buff效果
export interface Buff {
  type: string;
  value: number;
  duration: number; // -1 表示永久
  source: string;
}

// 战场武将实例
export interface BattleGeneral {
  instance_id: string;
  general_id: number;
  owner: PlayerSide;
  current_hp: number;
  position: Position;
  facing: Direction;
  atk_modifier: number;
  def_modifier: number;
  mov_modifier: number;
  has_acted: boolean;
  is_alive: boolean;
  buffs: Buff[];
  skill_state: Record<string, any>;
  moved_distance?: number; // 本回合已移动距离
}

// 位置
export interface Position {
  x: number;
  y: number;
}

// 地形类型
export type TerrainType = "plain" | "forest" | "mountain" | "river" | "bridge" | "road" | "city";

// 地形格子
export interface TerrainTile {
  type: TerrainType;
  mov_cost: number;
  def_bonus: number;
}

// 区域定义
export interface Area {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// 地图数据
export interface MapData {
  width: number;
  height: number;
  terrains: TerrainType[][];
  p1_spawn: Area;
  p2_spawn: Area;
  city_area: Area;
  city_gates: Position[];
}

// 游戏状态
export type GameStatus = "waiting" | "selecting" | "deploying" | "playing" | "finished";

// 游戏状态
export interface GameState {
  game_id: string;
  status: GameStatus;
  turn: number;
  current_player: PlayerSide;

  // 选将阶段
  banned_generals: number[];
  p1_picks: number[];
  p2_picks: number[];
  pick_phase: number;

  // 对战阶段
  p1_generals: BattleGeneral[];
  p2_generals: BattleGeneral[];

  // 城池状态
  city_holder: PlayerSide | null;
  city_hold_turns: number;

  // 地图
  map: MapData;

  // 结果
  winner: PlayerSide | null;
  win_reason: string | null;

  // 玩家信息
  p1_agent_id: string;
  p2_agent_id: string | null;

  // 上一次操作的武将ID列表（张辽威震技能用）
  attacked_enemies: Record<string, boolean>;

  // 姜维首次受伤记录
  first_damage_taken: Record<string, boolean>;
}

// 操作类型
export type ActionType = "MOVE" | "ATTACK" | "SKILL" | "WAIT" | "RETREAT" | "END_TURN";

// 操作请求
export interface ActionRequest {
  player: PlayerSide;
  action: ActionType;
  instance_id?: string;
  target_x?: number;
  target_y?: number;
  target_instance_id?: string;
  skill_target?: string;
}

// 战斗结果
export interface CombatResult {
  damage: number;
  counter_damage: number;
  attacker_killed: boolean;
  target_killed: boolean;
  triggered_skills: string[];
  special_effects: SpecialEffect[];
}

// 特殊效果
export interface SpecialEffect {
  type: string;
  target: string;
  value: any;
}

// WebSocket事件
export interface WSEvent {
  type: string;
  data: any;
  for_player?: PlayerSide;
}

// 错误码
export const ErrorCodes = {
  GAME_NOT_FOUND: { code: 1001, message: "游戏不存在" },
  NOT_YOUR_TURN: { code: 1002, message: "非当前玩家回合" },
  COOLDOWN: { code: 1003, message: "操作冷却中" },
  ALREADY_ACTED: { code: 1004, message: "武将已行动" },
  INVALID_POSITION: { code: 1005, message: "目标位置不可达" },
  TARGET_OUT_OF_RANGE: { code: 1006, message: "攻击目标不在范围内" },
  GENERAL_DEAD: { code: 1007, message: "武将已阵亡" },
  INVALID_ACTION: { code: 1008, message: "无效操作" },
  GAME_FULL: { code: 1009, message: "游戏已满" },
  INVALID_GENERAL: { code: 1010, message: "无效武将" },
  GENERAL_BANNED: { code: 1011, message: "武将已被禁用" },
  GENERAL_PICKED: { code: 1012, message: "武将已被选择" },
  INVALID_DEPLOY_POSITION: { code: 1013, message: "无效部署位置" },
  CANNOT_RETREAT: { code: 1014, message: "无法撤退（被典韦恶来技能限制）" },
} as const;

// API响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: number; message: string };
}

// 选将阶段顺序
export const PICK_ORDER: { phase: number; action: "ban" | "pick"; player: PlayerSide; count: number }[] = [
  { phase: 1, action: "ban", player: "p1", count: 1 },
  { phase: 2, action: "ban", player: "p2", count: 1 },
  { phase: 3, action: "ban", player: "p1", count: 1 },
  { phase: 4, action: "ban", player: "p2", count: 1 },
  { phase: 5, action: "pick", player: "p1", count: 1 },
  { phase: 6, action: "pick", player: "p2", count: 2 },
  { phase: 7, action: "pick", player: "p1", count: 2 },
  { phase: 8, action: "pick", player: "p2", count: 2 },
  { phase: 9, action: "pick", player: "p1", count: 2 },
  { phase: 10, action: "pick", player: "p2", count: 1 },
];

// 部署信息
export interface DeploymentInfo {
  general_id: number;
  x: number;
  y: number;
}

// 游戏状态响应（给玩家看的）
export interface GameStateResponse {
  game_id: string;
  status: GameStatus;
  turn: number;
  current_player: PlayerSide;
  my_player: PlayerSide;

  my_generals: {
    instance_id: string;
    general_id: number;
    name: string;
    current_hp: number;
    max_hp: number;
    atk: number;
    def: number;
    mov: number;
    position: Position;
    has_acted: boolean;
    buffs: string[];
  }[];

  visible_enemies: {
    instance_id: string;
    general_id: number;
    name: string;
    current_hp: number;
    max_hp: number;
    position: Position;
  }[];

  city: {
    holder: PlayerSide | "contested" | null;
    hold_turns: number;
  };

  action_cooldown: {
    can_act: boolean;
    next_action_time: number;
  };

  // 选将阶段信息
  pick_phase?: number;
  banned_generals?: number[];
  my_picks?: number[];
  enemy_picks?: number[];

  winner: PlayerSide | null;
  win_reason: string | null;
}
