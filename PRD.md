# 三国·夺城记 - Agent SLG 游戏 PRD

## 1. 项目概述

### 1.1 产品定位
一款专为 AI Agent 设计的回合制策略游戏，双方 Agent 在 100×100 的战场上指挥武将军团，争夺中央城池。

### 1.2 核心目标
- 简化数值模型，便于 Agent 理解和决策
- 限制操作频率（每5秒1次），考验策略规划能力
- 提供清晰的 API 接口，支持 Agent 自动对战

### 1.3 胜利条件
**占领中央城池并连续守住 10 回合**（城内只有己方武将时计数）

---

## 2. 技术架构

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge Network                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────────────┐    ┌────────────┐ │
│   │   Worker    │    │   Durable Objects   │    │     KV     │ │
│   │  (API层)    │◄──►│   (游戏状态管理)     │◄──►│ (配置缓存) │ │
│   └──────┬──────┘    └──────────┬──────────┘    └────────────┘ │
│          │                      │                               │
└──────────┼──────────────────────┼───────────────────────────────┘
           │                      │
           ▼                      ▼
    ┌─────────────────────────────────────┐
    │         TiDB Serverless             │
    │  ┌─────────┐  ┌─────────┐  ┌─────┐ │
    │  │ 对局记录 │  │ 用户数据 │  │ 排行 │ │
    │  └─────────┘  └─────────┘  └─────┘ │
    └─────────────────────────────────────┘
```

### 2.2 技术栈

| 组件 | 技术选型 | 用途 |
|------|----------|------|
| API 网关 | Cloudflare Worker | 请求路由、鉴权、限流 |
| 游戏状态 | Durable Objects | 实时游戏状态、WebSocket |
| 配置缓存 | Cloudflare KV | 武将数据、地图配置 |
| 持久化存储 | TiDB Serverless | 对局记录、用户数据、排行榜 |
| 开发语言 | TypeScript | 全栈统一 |

### 2.3 Cloudflare Worker 设计

#### 2.3.1 项目结构

```
src/
├── index.ts                 # Worker 入口
├── router.ts                # 路由定义
├── middleware/
│   ├── auth.ts              # Agent 认证
│   ├── rateLimit.ts         # 5秒限流
│   └── cors.ts              # CORS 处理
├── handlers/
│   ├── game.ts              # 游戏管理 API
│   ├── action.ts            # 游戏操作 API
│   └── query.ts             # 状态查询 API
├── durable-objects/
│   └── GameRoom.ts          # 游戏房间 DO
├── services/
│   ├── combat.ts            # 战斗计算
│   ├── movement.ts          # 移动计算
│   ├── skill.ts             # 技能系统
│   └── vision.ts            # 视野计算
├── db/
│   ├── tidb.ts              # TiDB 连接
│   └── queries.ts           # SQL 查询
├── data/
│   ├── generals.ts          # 武将数据
│   └── map.ts               # 地图数据
└── types/
    └── index.ts             # 类型定义
```

#### 2.3.2 wrangler.toml 配置

```toml
name = "three-kingdoms-slg"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Durable Objects
[durable_objects]
bindings = [
  { name = "GAME_ROOM", class_name = "GameRoom" }
]

[[migrations]]
tag = "v1"
new_classes = ["GameRoom"]

# KV Namespace
[[kv_namespaces]]
binding = "CONFIG_KV"
id = "xxx"

# 环境变量
[vars]
ENVIRONMENT = "production"

# Secrets (通过 wrangler secret put 设置)
# TIDB_HOST
# TIDB_USER  
# TIDB_PASSWORD
# TIDB_DATABASE
```

### 2.4 Durable Objects 设计

#### 2.4.1 GameRoom DO

```typescript
// src/durable-objects/GameRoom.ts

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private gameState: GameState | null = null;
  private connections: Map<string, WebSocket> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case "/ws":
        return this.handleWebSocket(request);
      case "/create":
        return this.handleCreate(request);
      case "/join":
        return this.handleJoin(request);
      case "/action":
        return this.handleAction(request);
      case "/state":
        return this.handleGetState(request);
      default:
        return new Response("Not found", { status: 404 });
    }
  }

  // WebSocket 处理
  async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    const playerId = new URL(request.url).searchParams.get("player");
    
    server.accept();
    this.connections.set(playerId!, server);

    server.addEventListener("close", () => {
      this.connections.delete(playerId!);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  // 广播状态更新
  private broadcast(event: WSEvent) {
    const message = JSON.stringify(event);
    for (const [playerId, ws] of this.connections) {
      try {
        // 发送该玩家视角的状态
        const playerEvent = this.filterEventForPlayer(event, playerId);
        ws.send(JSON.stringify(playerEvent));
      } catch (e) {
        this.connections.delete(playerId);
      }
    }
  }

  // 持久化状态
  async saveState() {
    await this.state.storage.put("gameState", this.gameState);
  }

  // 加载状态
  async loadState(): Promise<GameState | null> {
    return await this.state.storage.get("gameState") || null;
  }
}
```

#### 2.4.2 DO 状态管理

```typescript
interface GameRoomState {
  gameState: GameState;
  actionCooldowns: Map<string, number>;  // playerId -> nextActionTime
  turnStartTime: number;
  lastActivityTime: number;
}

// 状态持久化策略
// - 每次操作后立即保存关键状态
// - 使用 storage.put() 确保数据持久化
// - DO 会自动管理内存中的状态

async handleAction(request: Request): Promise<Response> {
  const action = await request.json() as ActionRequest;
  
  // 1. 检查冷却时间
  const cooldown = await this.state.storage.get(`cooldown:${action.player}`);
  if (cooldown && Date.now() < cooldown) {
    return Response.json({
      success: false,
      error: { code: 1003, message: "操作冷却中" }
    });
  }

  // 2. 执行操作
  const result = await this.executeAction(action);

  // 3. 更新冷却时间
  await this.state.storage.put(
    `cooldown:${action.player}`, 
    Date.now() + 5000
  );

  // 4. 保存游戏状态
  await this.saveState();

  // 5. 广播更新
  this.broadcast({ type: "action_result", data: result });

  return Response.json({ success: true, result });
}
```

### 2.5 TiDB 数据库设计

#### 2.5.1 连接配置

```typescript
// src/db/tidb.ts
import { connect } from "@tidbcloud/serverless";

export function createTiDBClient(env: Env) {
  return connect({
    host: env.TIDB_HOST,
    username: env.TIDB_USER,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE,
  });
}

// 在 Worker 中使用
export async function executeQuery<T>(
  env: Env, 
  sql: string, 
  params?: any[]
): Promise<T[]> {
  const client = createTiDBClient(env);
  const result = await client.execute(sql, params);
  return result.rows as T[];
}
```

#### 2.5.2 数据库表结构

```sql
-- 用户/Agent 表
CREATE TABLE agents (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  api_key_hash VARCHAR(256) NOT NULL,
  elo_rating INT DEFAULT 1200,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_elo (elo_rating DESC)
);

-- 对局记录表
CREATE TABLE games (
  id VARCHAR(64) PRIMARY KEY,
  p1_agent_id VARCHAR(64) NOT NULL,
  p2_agent_id VARCHAR(64),
  status ENUM('waiting', 'selecting', 'deploying', 'playing', 'finished') DEFAULT 'waiting',
  winner ENUM('p1', 'p2', 'draw'),
  win_reason VARCHAR(100),
  total_turns INT,
  p1_generals JSON,          -- 玩家1选择的武将
  p2_generals JSON,          -- 玩家2选择的武将
  banned_generals JSON,      -- 被ban的武将
  final_state JSON,          -- 最终游戏状态快照
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_p1 (p1_agent_id),
  INDEX idx_p2 (p2_agent_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
);

-- 操作日志表 (用于回放)
CREATE TABLE action_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  turn INT NOT NULL,
  player ENUM('p1', 'p2') NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  action_data JSON NOT NULL,
  result JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_game_turn (game_id, turn)
);

-- 排行榜表 (每日快照)
CREATE TABLE leaderboard_daily (
  date DATE NOT NULL,
  agent_id VARCHAR(64) NOT NULL,
  elo_rating INT NOT NULL,
  rank_position INT NOT NULL,
  games_today INT DEFAULT 0,
  wins_today INT DEFAULT 0,
  
  PRIMARY KEY (date, agent_id),
  INDEX idx_date_rank (date, rank_position)
);

-- 武将统计表
CREATE TABLE general_stats (
  general_id INT NOT NULL,
  total_picks INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_bans INT DEFAULT 0,
  avg_damage_dealt DECIMAL(10,2) DEFAULT 0,
  avg_damage_taken DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (general_id)
);
```

#### 2.5.3 常用查询

```typescript
// src/db/queries.ts

export const queries = {
  // 创建对局
  createGame: `
    INSERT INTO games (id, p1_agent_id, status, created_at)
    VALUES (?, ?, 'waiting', NOW())
  `,

  // 加入对局
  joinGame: `
    UPDATE games 
    SET p2_agent_id = ?, status = 'selecting', started_at = NOW()
    WHERE id = ? AND status = 'waiting'
  `,

  // 完成对局
  finishGame: `
    UPDATE games 
    SET status = 'finished', 
        winner = ?, 
        win_reason = ?,
        total_turns = ?,
        final_state = ?,
        finished_at = NOW()
    WHERE id = ?
  `,

  // 记录操作日志
  logAction: `
    INSERT INTO action_logs (game_id, turn, player, action_type, action_data, result)
    VALUES (?, ?, ?, ?, ?, ?)
  `,

  // 更新ELO评分
  updateElo: `
    UPDATE agents 
    SET elo_rating = elo_rating + ?,
        games_played = games_played + 1,
        games_won = games_won + ?
    WHERE id = ?
  `,

  // 获取排行榜
  getLeaderboard: `
    SELECT id, name, elo_rating, games_played, games_won,
           ROUND(games_won * 100.0 / NULLIF(games_played, 0), 1) as win_rate
    FROM agents
    ORDER BY elo_rating DESC
    LIMIT ?
  `,

  // 获取对局历史
  getGameHistory: `
    SELECT g.*, 
           a1.name as p1_name, 
           a2.name as p2_name
    FROM games g
    LEFT JOIN agents a1 ON g.p1_agent_id = a1.id
    LEFT JOIN agents a2 ON g.p2_agent_id = a2.id
    WHERE g.p1_agent_id = ? OR g.p2_agent_id = ?
    ORDER BY g.created_at DESC
    LIMIT ?
  `,

  // 武将统计更新
  updateGeneralStats: `
    INSERT INTO general_stats (general_id, total_picks, total_wins)
    VALUES (?, 1, ?)
    ON DUPLICATE KEY UPDATE
      total_picks = total_picks + 1,
      total_wins = total_wins + ?
  `,
};
```

### 2.6 限流实现

```typescript
// src/middleware/rateLimit.ts

export async function checkRateLimit(
  gameRoom: DurableObjectStub,
  playerId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const response = await gameRoom.fetch(
    new Request("http://internal/checkCooldown", {
      method: "POST",
      body: JSON.stringify({ playerId })
    })
  );
  
  return response.json();
}

// 在 GameRoom DO 内部实现
async checkCooldown(playerId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `cooldown:${playerId}`;
  const cooldownUntil = await this.state.storage.get<number>(key);
  
  const now = Date.now();
  
  if (cooldownUntil && now < cooldownUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((cooldownUntil - now) / 1000)
    };
  }
  
  // 设置新的冷却时间
  await this.state.storage.put(key, now + 5000);
  return { allowed: true };
}
```

### 2.7 Worker 入口示例

```typescript
// src/index.ts
import { Router } from "itty-router";
import { GameRoom } from "./durable-objects/GameRoom";

export { GameRoom };

const router = Router();

// CORS 预检
router.options("*", () => new Response(null, { 
  headers: corsHeaders 
}));

// 健康检查
router.get("/health", () => Response.json({ status: "ok" }));

// 创建游戏
router.post("/api/games", async (request, env) => {
  const { agent_id } = await request.json();
  const gameId = crypto.randomUUID();
  
  // 在 TiDB 创建记录
  await executeQuery(env, queries.createGame, [gameId, agent_id]);
  
  // 获取 Durable Object
  const roomId = env.GAME_ROOM.idFromName(gameId);
  const room = env.GAME_ROOM.get(roomId);
  
  // 初始化游戏房间
  await room.fetch(new Request("http://internal/create", {
    method: "POST",
    body: JSON.stringify({ gameId, p1: agent_id })
  }));
  
  return Response.json({ 
    game_id: gameId, 
    player: "p1", 
    status: "waiting" 
  });
});

// 加入游戏
router.post("/api/games/:gameId/join", async (request, env) => {
  const { gameId } = request.params;
  const { agent_id } = await request.json();
  
  // 更新 TiDB
  await executeQuery(env, queries.joinGame, [agent_id, gameId]);
  
  // 通知 Durable Object
  const roomId = env.GAME_ROOM.idFromName(gameId);
  const room = env.GAME_ROOM.get(roomId);
  
  const response = await room.fetch(new Request("http://internal/join", {
    method: "POST",
    body: JSON.stringify({ agent_id })
  }));
  
  return response;
});

// 执行操作
router.post("/api/games/:gameId/action", async (request, env) => {
  const { gameId } = request.params;
  const action = await request.json();
  
  const roomId = env.GAME_ROOM.idFromName(gameId);
  const room = env.GAME_ROOM.get(roomId);
  
  return room.fetch(new Request("http://internal/action", {
    method: "POST",
    body: JSON.stringify(action)
  }));
});

// 获取状态
router.get("/api/games/:gameId/state", async (request, env) => {
  const { gameId } = request.params;
  const player = new URL(request.url).searchParams.get("player");
  
  const roomId = env.GAME_ROOM.idFromName(gameId);
  const room = env.GAME_ROOM.get(roomId);
  
  return room.fetch(new Request(`http://internal/state?player=${player}`));
});

// WebSocket 连接
router.get("/api/games/:gameId/ws", async (request, env) => {
  const { gameId } = request.params;
  
  const roomId = env.GAME_ROOM.idFromName(gameId);
  const room = env.GAME_ROOM.get(roomId);
  
  return room.fetch(request);
});

// 排行榜
router.get("/api/leaderboard", async (request, env) => {
  const limit = new URL(request.url).searchParams.get("limit") || "50";
  const results = await executeQuery(env, queries.getLeaderboard, [parseInt(limit)]);
  return Response.json({ leaderboard: results });
});

// 404
router.all("*", () => new Response("Not Found", { status: 404 }));

export default {
  fetch: (request: Request, env: Env) => router.handle(request, env),
};
```

### 2.8 部署流程

```bash
# 1. 安装依赖
npm install

# 2. 配置 TiDB 密钥
wrangler secret put TIDB_HOST
wrangler secret put TIDB_USER
wrangler secret put TIDB_PASSWORD
wrangler secret put TIDB_DATABASE

# 3. 创建 KV namespace
wrangler kv:namespace create CONFIG_KV

# 4. 部署
wrangler deploy

# 5. 初始化 TiDB 表结构
# 使用 TiDB Cloud Console 或 mysql client 执行 SQL
```

---

## 3. 数据结构定义

### 3.1 武将 (General)

```typescript
interface General {
  id: number;           // 武将唯一ID (1-30)
  name: string;         // 武将名称
  faction: "蜀" | "魏" | "吴" | "群";  // 阵营
  type: string;         // 类型：猛将/骑兵/谋士/弓手/守将/刺客/均衡/君主
  
  // 基础属性 (均为 1-9)
  base_hp: number;      // 基础血量
  base_atk: number;     // 基础攻击
  base_def: number;     // 基础防御
  base_mov: number;     // 基础移动力
  
  // 技能
  skill_name: string;   // 技能名称
  skill_desc: string;   // 技能描述
  skill_type: "passive" | "active";  // 被动/主动
}
```

### 3.2 战场武将实例 (BattleGeneral)

```typescript
interface BattleGeneral {
  instance_id: string;  // 战场实例ID (格式: "p1_1" 或 "p2_3")
  general_id: number;   // 对应武将ID
  owner: "p1" | "p2";   // 所属玩家
  
  // 当前状态
  current_hp: number;   // 当前血量
  position: { x: number; y: number };  // 当前位置
  facing: "up" | "down" | "left" | "right";  // 面朝方向 (用于甘宁突袭)
  
  // Buff/Debuff 修正值
  atk_modifier: number; // 攻击修正
  def_modifier: number; // 防御修正
  mov_modifier: number; // 移动修正
  
  // 状态标记
  has_acted: boolean;   // 本回合是否已行动
  is_alive: boolean;    // 是否存活
  buffs: Buff[];        // 当前增益效果
  
  // 技能相关状态
  skill_state: Record<string, any>;  // 技能特殊状态存储
}

interface Buff {
  type: string;
  value: number;
  duration: number;  // 剩余回合数, -1 表示永久
  source: string;    // 来源
}
```

### 3.3 游戏状态 (GameState)

```typescript
interface GameState {
  game_id: string;
  status: "waiting" | "selecting" | "deploying" | "playing" | "finished";
  
  turn: number;                    // 当前回合数
  current_player: "p1" | "p2";     // 当前行动玩家
  
  // 选将阶段数据
  banned_generals: number[];       // 被ban的武将ID
  p1_picks: number[];              // P1选择的武将ID
  p2_picks: number[];              // P2选择的武将ID
  pick_phase: number;              // 当前选将阶段 (1-10)
  
  // 对战阶段数据
  p1_generals: BattleGeneral[];    // 玩家1的武将
  p2_generals: BattleGeneral[];    // 玩家2的武将
  
  city_holder: "p1" | "p2" | null; // 城池控制者
  city_hold_turns: number;         // 已守城回合数
  
  map: MapData;                    // 地图数据
  
  winner: "p1" | "p2" | null;      // 获胜者
  win_reason: string | null;
}
```

### 3.4 地图数据 (MapData)

```typescript
interface MapData {
  width: 100;
  height: 100;
  
  terrains: TerrainTile[][];  // 100x100 地形数组
  
  // 特殊区域
  p1_spawn: { x1: 0, y1: 0, x2: 19, y2: 19 };
  p2_spawn: { x1: 80, y1: 80, x2: 99, y2: 99 };
  city_area: { x1: 48, y1: 48, x2: 52, y2: 52 };
  city_gates: [
    { x: 48, y: 50 },  // 西门
    { x: 52, y: 50 },  // 东门
    { x: 50, y: 48 },  // 北门
    { x: 50, y: 52 }   // 南门
  ];
}

type TerrainType = "plain" | "forest" | "mountain" | "river" | "bridge" | "road" | "city";

interface TerrainTile {
  type: TerrainType;
  mov_cost: number;    // 移动消耗 (river = 999 表示不可通行)
  def_bonus: number;   // 防御加成
}
```

---

## 4. 武将数据表 (30位)

### 4.1 蜀汉 (10位)

| ID | 名称 | 类型 | HP | ATK | DEF | MOV | 技能名 | 技能效果 | 技能类型 |
|----|------|------|----|----|-----|-----|--------|----------|----------|
| 1 | 刘备 | 君主 | 6 | 4 | 5 | 5 | 仁德 | 相邻友军攻击+1 | passive |
| 2 | 关羽 | 猛将 | 7 | 9 | 6 | 4 | 武圣 | 攻击无视1点防御 | passive |
| 3 | 张飞 | 猛将 | 8 | 8 | 4 | 5 | 咆哮 | HP<3时攻击+2 | passive |
| 4 | 赵云 | 骑兵 | 6 | 7 | 6 | 7 | 龙胆 | 击杀后可再移动2格 | passive |
| 5 | 诸葛亮 | 谋士 | 4 | 3 | 3 | 4 | 神算 | 可指挥2格内友军行动(消耗自己行动) | active |
| 6 | 马超 | 骑兵 | 6 | 8 | 5 | 8 | 铁骑 | 本回合移动≥3格后攻击+2 | passive |
| 7 | 黄忠 | 弓手 | 5 | 7 | 4 | 4 | 百步 | 攻击范围3格 | passive |
| 8 | 魏延 | 猛将 | 7 | 7 | 5 | 5 | 反骨 | 被攻击时反击伤害+1 | passive |
| 9 | 姜维 | 均衡 | 6 | 6 | 5 | 6 | 胆略 | 每场战斗首次受伤减免1点 | passive |
| 10 | 庞统 | 谋士 | 4 | 4 | 3 | 5 | 连环 | 攻击时对目标相邻的1个敌人造成1点溅射伤害 | passive |

### 4.2 魏国 (11位)

| ID | 名称 | 类型 | HP | ATK | DEF | MOV | 技能名 | 技能效果 | 技能类型 |
|----|------|------|----|----|-----|-----|--------|----------|----------|
| 11 | 曹操 | 君主 | 6 | 6 | 5 | 5 | 奸雄 | 击杀敌人回复1HP | passive |
| 12 | 张辽 | 骑兵 | 6 | 7 | 5 | 7 | 威震 | 对每个敌人的首次攻击使其防御-1(持续到战斗结束) | passive |
| 13 | 夏侯惇 | 猛将 | 8 | 6 | 6 | 5 | 刚烈 | 受到伤害时对攻击者造成1点反伤 | passive |
| 14 | 夏侯渊 | 骑兵 | 5 | 6 | 4 | 9 | 急袭 | 无额外效果，纯高机动 | passive |
| 15 | 许褚 | 猛将 | 9 | 7 | 5 | 4 | 虎痴 | 无额外效果，纯高血量 | passive |
| 16 | 典韦 | 猛将 | 8 | 8 | 6 | 3 | 恶来 | 相邻敌人无法使用撤退指令 | passive |
| 17 | 司马懿 | 谋士 | 5 | 4 | 4 | 5 | 隐忍 | 连续3回合不移动不攻击后，攻防各+2(移动或攻击后重置) | passive |
| 18 | 郭嘉 | 谋士 | 3 | 3 | 2 | 6 | 鬼才 | 可查看5格范围内敌人下一步行动意图 | active |
| 19 | 张郃 | 均衡 | 6 | 6 | 6 | 6 | 巧变 | 可斜向移动 | passive |
| 20 | 徐晃 | 猛将 | 7 | 7 | 5 | 5 | 断粮 | 攻击位于己方出生区到城池连线上的敌人时伤害+2 | passive |
| 21 | 曹仁 | 守将 | 7 | 5 | 8 | 4 | 坚守 | 在城池内时额外防御+1 | passive |

### 4.3 吴国 (8位)

| ID | 名称 | 类型 | HP | ATK | DEF | MOV | 技能名 | 技能效果 | 技能类型 |
|----|------|------|----|----|-----|-----|--------|----------|----------|
| 22 | 孙权 | 君主 | 5 | 5 | 5 | 5 | 制衡 | 相邻友军共享最高防御值(取相邻友军中最高防御) | passive |
| 23 | 孙策 | 猛将 | 6 | 8 | 4 | 7 | 霸王 | 周围2格内只有1个敌人时攻击+3 | passive |
| 24 | 周瑜 | 谋士 | 5 | 5 | 4 | 5 | 火攻 | 攻击后目标获得"灼烧"状态，下回合开始受到1点伤害 | passive |
| 25 | 陆逊 | 谋士 | 5 | 5 | 5 | 6 | 营烧 | 攻击范围+1格(可攻击2格内敌人) | passive |
| 26 | 甘宁 | 刺客 | 5 | 8 | 3 | 8 | 突袭 | 从敌人背后(敌人面朝方向的反方向)攻击时伤害×2 | passive |
| 27 | 太史慈 | 弓手 | 6 | 7 | 5 | 5 | 神射 | 远程攻击(2-3格)时不受反击 | passive |
| 28 | 吕蒙 | 均衡 | 6 | 6 | 5 | 6 | 白衣 | 移动时可穿越敌方单位(不能停留) | passive |
| 29 | 黄盖 | 守将 | 7 | 5 | 7 | 4 | 苦肉 | 每损失1点HP，攻击+1 | passive |

### 4.4 群雄 (1位)

| ID | 名称 | 类型 | HP | ATK | DEF | MOV | 技能名 | 技能效果 | 技能类型 |
|----|------|------|----|----|-----|-----|--------|----------|----------|
| 30 | 吕布 | 猛将 | 7 | 9 | 5 | 8 | 无双 | 攻击时无视所有被动减伤效果 | passive |

### 4.5 武将数据 TypeScript 定义

```typescript
// src/data/generals.ts

export const GENERALS: General[] = [
  // 蜀汉
  { id: 1, name: "刘备", faction: "蜀", type: "君主", base_hp: 6, base_atk: 4, base_def: 5, base_mov: 5, skill_name: "仁德", skill_desc: "相邻友军攻击+1", skill_type: "passive" },
  { id: 2, name: "关羽", faction: "蜀", type: "猛将", base_hp: 7, base_atk: 9, base_def: 6, base_mov: 4, skill_name: "武圣", skill_desc: "攻击无视1点防御", skill_type: "passive" },
  { id: 3, name: "张飞", faction: "蜀", type: "猛将", base_hp: 8, base_atk: 8, base_def: 4, base_mov: 5, skill_name: "咆哮", skill_desc: "HP<3时攻击+2", skill_type: "passive" },
  { id: 4, name: "赵云", faction: "蜀", type: "骑兵", base_hp: 6, base_atk: 7, base_def: 6, base_mov: 7, skill_name: "龙胆", skill_desc: "击杀后可再移动2格", skill_type: "passive" },
  { id: 5, name: "诸葛亮", faction: "蜀", type: "谋士", base_hp: 4, base_atk: 3, base_def: 3, base_mov: 4, skill_name: "神算", skill_desc: "可指挥2格内友军行动", skill_type: "active" },
  { id: 6, name: "马超", faction: "蜀", type: "骑兵", base_hp: 6, base_atk: 8, base_def: 5, base_mov: 8, skill_name: "铁骑", skill_desc: "本回合移动≥3格后攻击+2", skill_type: "passive" },
  { id: 7, name: "黄忠", faction: "蜀", type: "弓手", base_hp: 5, base_atk: 7, base_def: 4, base_mov: 4, skill_name: "百步", skill_desc: "攻击范围3格", skill_type: "passive" },
  { id: 8, name: "魏延", faction: "蜀", type: "猛将", base_hp: 7, base_atk: 7, base_def: 5, base_mov: 5, skill_name: "反骨", skill_desc: "被攻击时反击伤害+1", skill_type: "passive" },
  { id: 9, name: "姜维", faction: "蜀", type: "均衡", base_hp: 6, base_atk: 6, base_def: 5, base_mov: 6, skill_name: "胆略", skill_desc: "每场战斗首次受伤减免1点", skill_type: "passive" },
  { id: 10, name: "庞统", faction: "蜀", type: "谋士", base_hp: 4, base_atk: 4, base_def: 3, base_mov: 5, skill_name: "连环", skill_desc: "攻击时对目标相邻敌人造成1点溅射", skill_type: "passive" },
  
  // 魏国
  { id: 11, name: "曹操", faction: "魏", type: "君主", base_hp: 6, base_atk: 6, base_def: 5, base_mov: 5, skill_name: "奸雄", skill_desc: "击杀敌人回复1HP", skill_type: "passive" },
  { id: 12, name: "张辽", faction: "魏", type: "骑兵", base_hp: 6, base_atk: 7, base_def: 5, base_mov: 7, skill_name: "威震", skill_desc: "首次攻击敌人使其防御-1", skill_type: "passive" },
  { id: 13, name: "夏侯惇", faction: "魏", type: "猛将", base_hp: 8, base_atk: 6, base_def: 6, base_mov: 5, skill_name: "刚烈", skill_desc: "受伤时对攻击者造成1点反伤", skill_type: "passive" },
  { id: 14, name: "夏侯渊", faction: "魏", type: "骑兵", base_hp: 5, base_atk: 6, base_def: 4, base_mov: 9, skill_name: "急袭", skill_desc: "纯高机动", skill_type: "passive" },
  { id: 15, name: "许褚", faction: "魏", type: "猛将", base_hp: 9, base_atk: 7, base_def: 5, base_mov: 4, skill_name: "虎痴", skill_desc: "纯高血量", skill_type: "passive" },
  { id: 16, name: "典韦", faction: "魏", type: "猛将", base_hp: 8, base_atk: 8, base_def: 6, base_mov: 3, skill_name: "恶来", skill_desc: "相邻敌人无法撤退", skill_type: "passive" },
  { id: 17, name: "司马懿", faction: "魏", type: "谋士", base_hp: 5, base_atk: 4, base_def: 4, base_mov: 5, skill_name: "隐忍", skill_desc: "3回合不动攻防+2", skill_type: "passive" },
  { id: 18, name: "郭嘉", faction: "魏", type: "谋士", base_hp: 3, base_atk: 3, base_def: 2, base_mov: 6, skill_name: "鬼才", skill_desc: "查看敌人行动意图", skill_type: "active" },
  { id: 19, name: "张郃", faction: "魏", type: "均衡", base_hp: 6, base_atk: 6, base_def: 6, base_mov: 6, skill_name: "巧变", skill_desc: "可斜向移动", skill_type: "passive" },
  { id: 20, name: "徐晃", faction: "魏", type: "猛将", base_hp: 7, base_atk: 7, base_def: 5, base_mov: 5, skill_name: "断粮", skill_desc: "攻击补给线上敌人伤害+2", skill_type: "passive" },
  { id: 21, name: "曹仁", faction: "魏", type: "守将", base_hp: 7, base_atk: 5, base_def: 8, base_mov: 4, skill_name: "坚守", skill_desc: "城池内额外防御+1", skill_type: "passive" },
  
  // 吴国
  { id: 22, name: "孙权", faction: "吴", type: "君主", base_hp: 5, base_atk: 5, base_def: 5, base_mov: 5, skill_name: "制衡", skill_desc: "相邻友军共享最高防御", skill_type: "passive" },
  { id: 23, name: "孙策", faction: "吴", type: "猛将", base_hp: 6, base_atk: 8, base_def: 4, base_mov: 7, skill_name: "霸王", skill_desc: "单挑时攻击+3", skill_type: "passive" },
  { id: 24, name: "周瑜", faction: "吴", type: "谋士", base_hp: 5, base_atk: 5, base_def: 4, base_mov: 5, skill_name: "火攻", skill_desc: "攻击造成灼烧", skill_type: "passive" },
  { id: 25, name: "陆逊", faction: "吴", type: "谋士", base_hp: 5, base_atk: 5, base_def: 5, base_mov: 6, skill_name: "营烧", skill_desc: "攻击范围+1格", skill_type: "passive" },
  { id: 26, name: "甘宁", faction: "吴", type: "刺客", base_hp: 5, base_atk: 8, base_def: 3, base_mov: 8, skill_name: "突袭", skill_desc: "背后攻击伤害×2", skill_type: "passive" },
  { id: 27, name: "太史慈", faction: "吴", type: "弓手", base_hp: 6, base_atk: 7, base_def: 5, base_mov: 5, skill_name: "神射", skill_desc: "远程攻击无反击", skill_type: "passive" },
  { id: 28, name: "吕蒙", faction: "吴", type: "均衡", base_hp: 6, base_atk: 6, base_def: 5, base_mov: 6, skill_name: "白衣", skill_desc: "可穿越敌方单位", skill_type: "passive" },
  { id: 29, name: "黄盖", faction: "吴", type: "守将", base_hp: 7, base_atk: 5, base_def: 7, base_mov: 4, skill_name: "苦肉", skill_desc: "损失HP转化为攻击", skill_type: "passive" },
  
  // 群雄
  { id: 30, name: "吕布", faction: "群", type: "猛将", base_hp: 7, base_atk: 9, base_def: 5, base_mov: 8, skill_name: "无双", skill_desc: "无视被动减伤", skill_type: "passive" },
];
```

---

## 5. 地形系统

### 5.1 地形类型

| 地形 | 符号 | 移动消耗 | 防御加成 | 说明 |
|------|------|----------|----------|------|
| 平原 | . | 1 | 0 | 默认地形 |
| 树林 | 🌲 | 2 | +1 | 散布于地图中 |
| 山地 | 🏔️ | 3 | +2 | 战略要地 |
| 河流 | 🌊 | ∞ | - | 不可通行，只能走桥 |
| 桥梁 | 🌉 | 1 | 0 | 河流上的通道 |
| 道路 | 🛤️ | 0.5 | 0 | 快速移动通道 |
| 城池 | 🏯 | 1 | +2 | 中央目标区域 |

### 5.2 关键坐标

| 区域 | 坐标范围 |
|------|----------|
| P1出生区 | (0,0) - (19,19) |
| P2出生区 | (80,80) - (99,99) |
| 中央城池 | (48,48) - (52,52) |
| 西城门 | (48, 50) |
| 东城门 | (52, 50) |
| 北城门 | (50, 48) |
| 南城门 | (50, 52) |
| 北河流 | y = 25, x = 0-99 |
| 南河流 | y = 75, x = 0-99 |
| 北桥1 | (33, 25) |
| 北桥2 | (66, 25) |
| 南桥1 | (33, 75) |
| 南桥2 | (66, 75) |

---

## 6. 游戏流程

### 6.1 阶段流程

```
1. 匹配阶段 (WAITING)
   └─> 两个 Agent 加入游戏
   
2. 选将阶段 (SELECTING)
   └─> 双方交替 Ban/Pick，各选 5 名武将
   └─> 时限：每次选择 30 秒
   
3. 部署阶段 (DEPLOYING)
   └─> 双方在各自出生区部署武将位置
   └─> 时限：60 秒
   
4. 对战阶段 (PLAYING)
   └─> 回合制对战，每 5 秒可执行 1 次操作
   └─> 直到一方获胜或达到回合上限(200回合)
   
5. 结算阶段 (FINISHED)
   └─> 记录对局数据到 TiDB，返回结果
```

### 6.2 选将规则 (Ban/Pick)

```
顺序：
1. P1 Ban 1
2. P2 Ban 1
3. P1 Ban 1
4. P2 Ban 1
5. P1 Pick 1
6. P2 Pick 2
7. P1 Pick 2
8. P2 Pick 2
9. P1 Pick 2
10. P2 Pick 1

总计：各 Ban 2，各 Pick 5
```

---

## 7. 战斗系统

### 7.1 伤害计算

```typescript
// src/services/combat.ts

export function calculateDamage(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): CombatResult {
  const attackerData = getGeneralById(attacker.general_id);
  const defenderData = getGeneralById(defender.general_id);
  const terrain = getTerrain(gameState.map, defender.position);
  
  // 基础攻击力
  let atk = attackerData.base_atk + attacker.atk_modifier;
  
  // 基础防御力
  let def = defenderData.base_def + defender.def_modifier + terrain.def_bonus;
  
  // 应用技能效果
  const skillEffects = applySkillEffects(attacker, defender, gameState);
  atk += skillEffects.atkBonus;
  def += skillEffects.defPenalty;
  
  // 最终伤害 (最低1点)
  const damage = Math.max(1, atk - def);
  
  return {
    damage,
    triggeredSkills: skillEffects.triggered,
    specialEffects: skillEffects.special
  };
}
```

### 7.2 反击机制

```typescript
export function calculateCounterAttack(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): number {
  // 远程攻击不触发反击
  if (isRangedAttack(attacker, defender)) {
    return 0;
  }
  
  // 太史慈神射：远程攻击无反击
  if (getGeneralById(attacker.general_id).skill_name === "神射") {
    const distance = manhattanDistance(attacker.position, defender.position);
    if (distance >= 2) return 0;
  }
  
  // 计算反击伤害
  const counterDamage = Math.floor(
    calculateDamage(defender, attacker, gameState).damage / 2
  );
  
  // 魏延反骨：反击伤害+1
  if (getGeneralById(defender.general_id).skill_name === "反骨") {
    return counterDamage + 1;
  }
  
  return counterDamage;
}
```

---

## 8. API 接口设计

### 8.1 基础信息

- **Base URL**: `https://three-kingdoms-slg.{your-account}.workers.dev`
- **认证方式**: Bearer Token (API Key)
- **内容类型**: `application/json`

### 8.2 游戏管理

#### 创建游戏
```
POST /api/games
Headers: { "Authorization": "Bearer {api_key}" }
Request: {}
Response: { 
  "game_id": "uuid", 
  "player": "p1", 
  "status": "waiting",
  "ws_url": "wss://three-kingdoms-slg.xxx.workers.dev/api/games/{id}/ws?player=p1"
}
```

#### 加入游戏
```
POST /api/games/{game_id}/join
Headers: { "Authorization": "Bearer {api_key}" }
Response: { 
  "game_id": "uuid", 
  "player": "p2", 
  "status": "selecting"
}
```

#### 获取游戏状态
```
GET /api/games/{game_id}/state?player=p1
Response: GameStateResponse
```

### 8.3 选将阶段

#### Ban 武将
```
POST /api/games/{game_id}/ban
Request: { "general_id": 30 }
Response: { "success": true, "banned": [30], "next_action": "p2_ban" }
```

#### Pick 武将
```
POST /api/games/{game_id}/pick
Request: { "general_id": 2 }
Response: { "success": true, "picked": [2], "next_action": "p2_pick" }
```

### 8.4 部署阶段

```
POST /api/games/{game_id}/deploy
Request: {
  "deployments": [
    { "general_id": 2, "x": 10, "y": 10 },
    { "general_id": 4, "x": 5, "y": 15 }
  ]
}
Response: { "success": true, "status": "playing" }
```

### 8.5 对战阶段

#### 移动
```
POST /api/games/{game_id}/action
Request: {
  "action": "MOVE",
  "instance_id": "p1_1",
  "target_x": 45,
  "target_y": 50
}
Response: {
  "success": true,
  "result": {
    "action": "MOVE",
    "from": { "x": 40, "y": 45 },
    "to": { "x": 45, "y": 50 }
  },
  "cooldown_until": 1699999999999
}
```

#### 攻击
```
POST /api/games/{game_id}/action
Request: {
  "action": "ATTACK",
  "instance_id": "p1_2",
  "target_instance_id": "p2_3"
}
Response: {
  "success": true,
  "result": {
    "damage_dealt": 4,
    "counter_damage": 1,
    "target_remaining_hp": 3,
    "target_killed": false,
    "triggered_skills": ["武圣"]
  }
}
```

#### 技能/待命/撤退/结束回合
```
POST /api/games/{game_id}/action
Request: { "action": "SKILL" | "WAIT" | "RETREAT" | "END_TURN", ... }
```

### 8.6 状态查询响应

```typescript
interface GameStateResponse {
  game_id: string;
  status: "waiting" | "selecting" | "deploying" | "playing" | "finished";
  turn: number;
  current_player: "p1" | "p2";
  
  my_generals: {
    instance_id: string;
    general_id: number;
    name: string;
    current_hp: number;
    max_hp: number;
    atk: number;
    def: number;
    mov: number;
    position: { x: number; y: number };
    has_acted: boolean;
    buffs: string[];
  }[];
  
  visible_enemies: {
    instance_id: string;
    general_id: number;
    name: string;
    current_hp: number;
    max_hp: number;
    position: { x: number; y: number };
  }[];
  
  city: {
    holder: "p1" | "p2" | "contested" | null;
    hold_turns: number;
  };
  
  action_cooldown: {
    can_act: boolean;
    next_action_time: number;
  };
  
  winner: "p1" | "p2" | null;
}
```

---

## 9. 错误处理

| 错误码 | 说明 |
|--------|------|
| 1001 | 游戏不存在 |
| 1002 | 非当前玩家回合 |
| 1003 | 操作冷却中 |
| 1004 | 武将已行动 |
| 1005 | 目标位置不可达 |
| 1006 | 攻击目标不在范围内 |
| 1007 | 武将已阵亡 |

---

## 10. 验收标准

### 10.1 功能验收

- [ ] Worker 部署成功，API 可访问
- [ ] Durable Object 正确管理游戏状态
- [ ] TiDB 正确存储对局记录
- [ ] WebSocket 实时推送正常
- [ ] 5秒操作冷却限制有效
- [ ] 30 位武将技能全部实现
- [ ] 战斗伤害计算准确
- [ ] 城池占领判定正确

### 10.2 性能验收

- [ ] API 冷启动 < 200ms
- [ ] API 热响应 < 50ms
- [ ] 支持 100 场并发对局
- [ ] TiDB 查询 < 100ms

---

## 附录: 快速参考

### 伤害公式
```
伤害 = max(1, ATK - DEF - 地形防御)
反击 = 伤害 // 2
```

### 部署命令
```bash
wrangler secret put TIDB_HOST
wrangler secret put TIDB_USER
wrangler secret put TIDB_PASSWORD
wrangler deploy
```

### 武将属性极值
| 最高攻击 | 关羽、吕布 (9) |
| 最高血量 | 许褚 (9) |
| 最高防御 | 曹仁 (8) |
| 最高移动 | 夏侯渊 (9) |

---

*文档版本: 2.0 (Cloudflare Worker + TiDB)*
*最后更新: 2025-02*
