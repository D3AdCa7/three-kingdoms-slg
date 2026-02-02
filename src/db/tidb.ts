import { connect, Connection } from "@tidbcloud/serverless";
import { Env } from "../types";

// 创建TiDB客户端
export function createTiDBClient(env: Env): Connection {
  return connect({
    host: env.TIDB_HOST,
    username: env.TIDB_USER,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE,
  });
}

// 执行查询
export async function executeQuery<T>(
  env: Env,
  sql: string,
  params?: any[]
): Promise<T[]> {
  const client = createTiDBClient(env);
  const result = await client.execute(sql, params);
  // Handle both array and FullResult types
  if (Array.isArray(result)) {
    return result as T[];
  }
  return ((result as any).rows || []) as T[];
}

// 执行单条插入/更新/删除
export async function executeUpdate(
  env: Env,
  sql: string,
  params?: any[]
): Promise<{ affectedRows: number }> {
  const client = createTiDBClient(env);
  const result = await client.execute(sql, params);
  // Handle both array and FullResult types
  if (Array.isArray(result)) {
    return { affectedRows: 0 };
  }
  return { affectedRows: (result as any).rowsAffected || 0 };
}

// SQL查询定义
export const queries = {
  // ===== Agent相关 =====
  
  // 创建Agent
  createAgent: `
    INSERT INTO agents (id, name, api_key_hash, elo_rating, games_played, games_won, created_at, updated_at)
    VALUES (?, ?, ?, 1200, 0, 0, NOW(), NOW())
  `,
  
  // 根据API Key Hash获取Agent
  getAgentByApiKeyHash: `
    SELECT id, name, elo_rating, games_played, games_won, created_at
    FROM agents
    WHERE api_key_hash = ?
  `,
  
  // 根据ID获取Agent
  getAgentById: `
    SELECT id, name, elo_rating, games_played, games_won, created_at
    FROM agents
    WHERE id = ?
  `,
  
  // 更新ELO评分
  updateElo: `
    UPDATE agents 
    SET elo_rating = elo_rating + ?,
        games_played = games_played + 1,
        games_won = games_won + ?,
        updated_at = NOW()
    WHERE id = ?
  `,

  // ===== 游戏相关 =====
  
  // 创建游戏
  createGame: `
    INSERT INTO games (id, p1_agent_id, status, created_at)
    VALUES (?, ?, 'waiting', NOW())
  `,
  
  // 加入游戏
  joinGame: `
    UPDATE games 
    SET p2_agent_id = ?, status = 'selecting', started_at = NOW()
    WHERE id = ? AND status = 'waiting' AND p2_agent_id IS NULL
  `,
  
  // 更新游戏状态
  updateGameStatus: `
    UPDATE games
    SET status = ?
    WHERE id = ?
  `,
  
  // 完成游戏
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
  
  // 获取游戏信息
  getGame: `
    SELECT g.*, 
           a1.name as p1_name, a1.elo_rating as p1_elo,
           a2.name as p2_name, a2.elo_rating as p2_elo
    FROM games g
    LEFT JOIN agents a1 ON g.p1_agent_id = a1.id
    LEFT JOIN agents a2 ON g.p2_agent_id = a2.id
    WHERE g.id = ?
  `,
  
  // 获取等待中的游戏列表
  getWaitingGames: `
    SELECT g.id, g.p1_agent_id, g.created_at,
           a.name as p1_name, a.elo_rating as p1_elo
    FROM games g
    LEFT JOIN agents a ON g.p1_agent_id = a.id
    WHERE g.status = 'waiting'
    ORDER BY g.created_at ASC
    LIMIT ?
  `,
  
  // 保存武将选择
  saveGeneralPicks: `
    UPDATE games
    SET p1_generals = ?, p2_generals = ?, banned_generals = ?
    WHERE id = ?
  `,

  // ===== 操作日志 =====
  
  // 记录操作日志
  logAction: `
    INSERT INTO action_logs (game_id, turn, player, action_type, action_data, result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `,
  
  // 获取游戏操作日志（用于回放）
  getActionLogs: `
    SELECT turn, player, action_type, action_data, result, created_at
    FROM action_logs
    WHERE game_id = ?
    ORDER BY id ASC
  `,

  // ===== 排行榜 =====
  
  // 获取排行榜
  getLeaderboard: `
    SELECT id, name, elo_rating, games_played, games_won,
           ROUND(games_won * 100.0 / NULLIF(games_played, 0), 1) as win_rate
    FROM agents
    WHERE games_played > 0
    ORDER BY elo_rating DESC
    LIMIT ?
  `,
  
  // 获取对局历史
  getGameHistory: `
    SELECT g.id, g.status, g.winner, g.win_reason, g.total_turns, 
           g.started_at, g.finished_at,
           a1.name as p1_name, a2.name as p2_name
    FROM games g
    LEFT JOIN agents a1 ON g.p1_agent_id = a1.id
    LEFT JOIN agents a2 ON g.p2_agent_id = a2.id
    WHERE g.p1_agent_id = ? OR g.p2_agent_id = ?
    ORDER BY g.created_at DESC
    LIMIT ?
  `,
  
  // 保存每日排行榜快照
  saveDailyLeaderboard: `
    INSERT INTO leaderboard_daily (date, agent_id, elo_rating, rank_position, games_today, wins_today)
    VALUES (CURDATE(), ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      elo_rating = VALUES(elo_rating),
      rank_position = VALUES(rank_position),
      games_today = VALUES(games_today),
      wins_today = VALUES(wins_today)
  `,

  // ===== 武将统计 =====
  
  // 更新武将统计
  updateGeneralStats: `
    INSERT INTO general_stats (general_id, total_picks, total_wins, total_bans)
    VALUES (?, 1, ?, 0)
    ON DUPLICATE KEY UPDATE
      total_picks = total_picks + 1,
      total_wins = total_wins + VALUES(total_wins),
      updated_at = NOW()
  `,
  
  // 更新武将Ban统计
  updateGeneralBanStats: `
    INSERT INTO general_stats (general_id, total_picks, total_wins, total_bans)
    VALUES (?, 0, 0, 1)
    ON DUPLICATE KEY UPDATE
      total_bans = total_bans + 1,
      updated_at = NOW()
  `,
  
  // 获取武将统计
  getGeneralStats: `
    SELECT general_id, total_picks, total_wins, total_bans,
           ROUND(total_wins * 100.0 / NULLIF(total_picks, 0), 1) as win_rate
    FROM general_stats
    ORDER BY total_picks DESC
  `,
};

// GameDatabase 类封装
export class GameDatabase {
  constructor(private env: Env) {}

  async createGame(gameId: string, agentId: string): Promise<void> {
    await executeUpdate(this.env, queries.createGame, [gameId, agentId]);
  }

  async joinGame(gameId: string, agentId: string): Promise<void> {
    await executeUpdate(this.env, queries.joinGame, [agentId, gameId]);
  }

  async getWaitingGame(excludeAgentId: string): Promise<{ id: string } | null> {
    const games = await executeQuery<{ id: string }>(
      this.env,
      `SELECT id FROM games WHERE status = 'waiting' AND p1_agent_id != ? ORDER BY created_at ASC LIMIT 1`,
      [excludeAgentId]
    );
    return games[0] || null;
  }

  async getGame(gameId: string): Promise<any> {
    const games = await executeQuery(this.env, queries.getGame, [gameId]);
    return games[0] || null;
  }

  async finishGame(gameId: string, winner: string, winReason: string, totalTurns: number, finalState: any): Promise<void> {
    await executeUpdate(this.env, queries.finishGame, [winner, winReason, totalTurns, JSON.stringify(finalState), gameId]);
  }

  async updateElo(agentId: string, eloChange: number, won: boolean): Promise<void> {
    await executeUpdate(this.env, queries.updateElo, [eloChange, won ? 1 : 0, agentId]);
  }

  async getLeaderboard(limit: number = 50): Promise<any[]> {
    return executeQuery(this.env, queries.getLeaderboard, [limit]);
  }

  async getGameHistory(agentId: string, limit: number = 20): Promise<any[]> {
    return executeQuery(this.env, queries.getGameHistory, [agentId, agentId, limit]);
  }

  async logAction(gameId: string, turn: number, player: string, actionType: string, actionData: any, result: any): Promise<void> {
    await executeUpdate(this.env, queries.logAction, [gameId, turn, player, actionType, JSON.stringify(actionData), JSON.stringify(result)]);
  }

  async getAgentByApiKeyHash(hash: string): Promise<any> {
    const agents = await executeQuery(this.env, queries.getAgentByApiKeyHash, [hash]);
    return agents[0] || null;
  }

  async createAgent(id: string, name: string, apiKeyHash: string): Promise<void> {
    await executeUpdate(this.env, queries.createAgent, [id, name, apiKeyHash]);
  }
}

// ELO计算
export function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  kFactor: number = 32
): { winnerChange: number; loserChange: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;
  
  const winnerChange = Math.round(kFactor * (1 - expectedWinner));
  const loserChange = Math.round(kFactor * (0 - expectedLoser));
  
  return { winnerChange, loserChange };
}

// 数据库初始化SQL（用于首次部署）
export const initSQL = `
-- 用户/Agent 表
CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  api_key_hash VARCHAR(256) NOT NULL,
  elo_rating INT DEFAULT 1200,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_elo (elo_rating DESC),
  INDEX idx_api_key (api_key_hash)
);

-- 对局记录表
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(64) PRIMARY KEY,
  p1_agent_id VARCHAR(64) NOT NULL,
  p2_agent_id VARCHAR(64),
  status ENUM('waiting', 'selecting', 'deploying', 'playing', 'finished') DEFAULT 'waiting',
  winner ENUM('p1', 'p2', 'draw'),
  win_reason VARCHAR(100),
  total_turns INT,
  p1_generals JSON,
  p2_generals JSON,
  banned_generals JSON,
  final_state JSON,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_p1 (p1_agent_id),
  INDEX idx_p2 (p2_agent_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS action_logs (
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

-- 排行榜每日快照
CREATE TABLE IF NOT EXISTS leaderboard_daily (
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
CREATE TABLE IF NOT EXISTS general_stats (
  general_id INT PRIMARY KEY,
  total_picks INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_bans INT DEFAULT 0,
  avg_damage_dealt DECIMAL(10,2) DEFAULT 0,
  avg_damage_taken DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;
