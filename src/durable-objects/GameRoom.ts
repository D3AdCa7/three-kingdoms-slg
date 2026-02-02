import {
  Env,
  GameState,
  GameStatus,
  PlayerSide,
  BattleGeneral,
  Position,
  ActionRequest,
  ActionType,
  WSEvent,
  DeploymentInfo,
  PICK_ORDER,
  ErrorCodes,
} from "../types";
import { getGeneralById, GENERALS } from "../data/generals";
import { MAP_DATA, isInArea, getSpawnArea, isInCity, manhattanDistance } from "../data/map";
import { calculateCombat, applyCombatResult, processBurnDamage } from "../services/combat";
import { executeMove, canMoveTo, getMoveableArea, executeExtraMove } from "../services/movement";
import { getVisibleEnemies, filterGameStateForPlayer } from "../services/vision";
import { canRetreat, updateInactiveRounds, processRoundStartEffects } from "../services/skill";

export class GameRoom {
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

    try {
      switch (url.pathname) {
        case "/ws":
          return this.handleWebSocket(request);
        case "/create":
          return this.handleCreate(request);
        case "/join":
          return this.handleJoin(request);
        case "/ban":
          return this.handleBan(request);
        case "/pick":
          return this.handlePick(request);
        case "/deploy":
          return this.handleDeploy(request);
        case "/action":
          return this.handleAction(request);
        case "/state":
          return this.handleGetState(request);
        case "/checkCooldown":
          return this.handleCheckCooldown(request);
        case "/moveable":
          return this.handleGetMoveable(request);
        default:
          return new Response("Not found", { status: 404 });
      }
    } catch (error) {
      console.error("GameRoom error:", error);
      return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
    }
  }

  // WebSocket 处理
  async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    const playerId = new URL(request.url).searchParams.get("player") as PlayerSide;

    server.accept();
    this.connections.set(playerId, server);

    server.addEventListener("close", () => {
      this.connections.delete(playerId);
    });

    server.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        // 处理客户端消息（如心跳）
        if (data.type === "ping") {
          server.send(JSON.stringify({ type: "pong" }));
        }
      } catch (e) {
        // 忽略无效消息
      }
    });

    // 发送当前状态
    const gameState = await this.loadState();
    if (gameState) {
      const filteredState = filterGameStateForPlayer(gameState, playerId);
      server.send(JSON.stringify({ type: "state", data: filteredState }));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // 创建游戏
  async handleCreate(request: Request): Promise<Response> {
    const { gameId, p1 } = await request.json() as { gameId: string; p1: string };

    const gameState: GameState = {
      game_id: gameId,
      status: "waiting",
      turn: 0,
      current_player: "p1",
      banned_generals: [],
      p1_picks: [],
      p2_picks: [],
      pick_phase: 0,
      p1_generals: [],
      p2_generals: [],
      city_holder: null,
      city_hold_turns: 0,
      map: MAP_DATA,
      winner: null,
      win_reason: null,
      p1_agent_id: p1,
      p2_agent_id: null,
      attacked_enemies: {},
      first_damage_taken: {},
    };

    this.gameState = gameState;
    await this.saveState();

    return Response.json({ success: true, game_id: gameId, player: "p1", status: "waiting" });
  }

  // 加入游戏
  async handleJoin(request: Request): Promise<Response> {
    const { agent_id } = await request.json() as { agent_id: string };

    let gameState = await this.loadState();
    if (!gameState) {
      return Response.json({ success: false, error: ErrorCodes.GAME_NOT_FOUND });
    }

    if (gameState.status !== "waiting") {
      return Response.json({ success: false, error: ErrorCodes.GAME_FULL });
    }

    gameState.p2_agent_id = agent_id;
    gameState.status = "selecting";
    gameState.pick_phase = 1;

    this.gameState = gameState;
    await this.saveState();

    // 广播状态更新
    this.broadcast({ type: "game_started", data: { status: "selecting" } });

    return Response.json({ success: true, game_id: gameState.game_id, player: "p2", status: "selecting" });
  }

  // Ban武将
  async handleBan(request: Request): Promise<Response> {
    const { player, general_id } = await request.json() as { player: PlayerSide; general_id: number };

    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "selecting") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }

    // 检查是否轮到该玩家
    const currentPhase = PICK_ORDER[gameState.pick_phase - 1];
    if (!currentPhase || currentPhase.action !== "ban" || currentPhase.player !== player) {
      return Response.json({ success: false, error: ErrorCodes.NOT_YOUR_TURN });
    }

    // 检查武将是否有效
    if (!GENERALS.find(g => g.id === general_id)) {
      return Response.json({ success: false, error: ErrorCodes.INVALID_GENERAL });
    }

    // 检查武将是否已被ban或pick
    if (gameState.banned_generals.includes(general_id) ||
        gameState.p1_picks.includes(general_id) ||
        gameState.p2_picks.includes(general_id)) {
      return Response.json({ success: false, error: ErrorCodes.GENERAL_BANNED });
    }

    gameState.banned_generals.push(general_id);
    gameState.pick_phase++;

    this.gameState = gameState;
    await this.saveState();

    this.broadcast({
      type: "ban",
      data: { player, general_id, banned: gameState.banned_generals, next_phase: gameState.pick_phase }
    });

    return Response.json({ success: true, banned: gameState.banned_generals, next_phase: gameState.pick_phase });
  }

  // Pick武将
  async handlePick(request: Request): Promise<Response> {
    const { player, general_id } = await request.json() as { player: PlayerSide; general_id: number };

    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "selecting") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }

    // 检查是否轮到该玩家
    const currentPhase = PICK_ORDER[gameState.pick_phase - 1];
    if (!currentPhase || currentPhase.action !== "pick" || currentPhase.player !== player) {
      return Response.json({ success: false, error: ErrorCodes.NOT_YOUR_TURN });
    }

    // 检查武将是否有效
    if (!GENERALS.find(g => g.id === general_id)) {
      return Response.json({ success: false, error: ErrorCodes.INVALID_GENERAL });
    }

    // 检查武将是否已被ban或pick
    if (gameState.banned_generals.includes(general_id) ||
        gameState.p1_picks.includes(general_id) ||
        gameState.p2_picks.includes(general_id)) {
      return Response.json({ success: false, error: ErrorCodes.GENERAL_PICKED });
    }

    // 添加到玩家的picks
    if (player === "p1") {
      gameState.p1_picks.push(general_id);
    } else {
      gameState.p2_picks.push(general_id);
    }

    gameState.pick_phase++;

    // 检查选将是否完成
    if (gameState.pick_phase > PICK_ORDER.length) {
      gameState.status = "deploying";
    }

    this.gameState = gameState;
    await this.saveState();

    this.broadcast({
      type: "pick",
      data: {
        player,
        general_id,
        p1_picks: gameState.p1_picks,
        p2_picks: gameState.p2_picks,
        next_phase: gameState.pick_phase,
        status: gameState.status
      }
    });

    return Response.json({
      success: true,
      picked: player === "p1" ? gameState.p1_picks : gameState.p2_picks,
      next_phase: gameState.pick_phase,
      status: gameState.status
    });
  }

  // 部署武将
  async handleDeploy(request: Request): Promise<Response> {
    const { player, deployments } = await request.json() as { player: PlayerSide; deployments: DeploymentInfo[] };

    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "deploying") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }

    const picks = player === "p1" ? gameState.p1_picks : gameState.p2_picks;
    const spawnArea = getSpawnArea(player);

    // 验证部署
    if (deployments.length !== picks.length) {
      return Response.json({ success: false, error: { code: 1013, message: "武将数量不匹配" } });
    }

    const deployedIds = new Set<number>();
    const deployedPositions = new Set<string>();

    for (const dep of deployments) {
      // 检查武将ID是否在picks中
      if (!picks.includes(dep.general_id)) {
        return Response.json({ success: false, error: ErrorCodes.INVALID_GENERAL });
      }

      // 检查是否重复部署
      if (deployedIds.has(dep.general_id)) {
        return Response.json({ success: false, error: { code: 1013, message: "武将重复部署" } });
      }

      // 检查位置是否在出生区
      if (!isInArea(dep.x, dep.y, spawnArea)) {
        return Response.json({ success: false, error: ErrorCodes.INVALID_DEPLOY_POSITION });
      }

      // 检查位置是否重复
      const posKey = `${dep.x},${dep.y}`;
      if (deployedPositions.has(posKey)) {
        return Response.json({ success: false, error: { code: 1013, message: "位置重复" } });
      }

      deployedIds.add(dep.general_id);
      deployedPositions.add(posKey);
    }

    // 创建BattleGeneral实例
    const generals: BattleGeneral[] = deployments.map((dep, index) => {
      const data = getGeneralById(dep.general_id)!;
      return {
        instance_id: `${player}_${index + 1}`,
        general_id: dep.general_id,
        owner: player,
        current_hp: data.base_hp,
        position: { x: dep.x, y: dep.y },
        facing: player === "p1" ? "right" : "left",
        atk_modifier: 0,
        def_modifier: 0,
        mov_modifier: 0,
        has_acted: false,
        is_alive: true,
        buffs: [],
        skill_state: {},
        moved_distance: 0,
      };
    });

    if (player === "p1") {
      gameState.p1_generals = generals;
    } else {
      gameState.p2_generals = generals;
    }

    // 检查双方是否都已部署
    if (gameState.p1_generals.length > 0 && gameState.p2_generals.length > 0) {
      gameState.status = "playing";
      gameState.turn = 1;
      gameState.current_player = "p1";
    }

    this.gameState = gameState;
    await this.saveState();

    this.broadcast({
      type: "deploy",
      data: { player, status: gameState.status, turn: gameState.turn }
    });

    return Response.json({ success: true, status: gameState.status });
  }

  // 处理游戏操作
  async handleAction(request: Request): Promise<Response> {
    const action = await request.json() as ActionRequest;

    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "playing") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }

    // 检查是否是当前玩家
    if (action.player !== gameState.current_player) {
      return Response.json({ success: false, error: ErrorCodes.NOT_YOUR_TURN });
    }

    let result: any;

    switch (action.action) {
      case "MOVE":
        result = await this.handleMoveAction(action, gameState);
        break;
      case "ATTACK":
        result = await this.handleAttackAction(action, gameState);
        break;
      case "SKILL":
        result = await this.handleSkillAction(action, gameState);
        break;
      case "WAIT":
        result = await this.handleWaitAction(action, gameState);
        break;
      case "RETREAT":
        result = await this.handleRetreatAction(action, gameState);
        break;
      case "END_TURN":
        result = await this.handleEndTurnAction(action, gameState);
        break;
      default:
        return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }

    if (!result.success) {
      return Response.json(result);
    }

    // 检查胜负
    this.checkVictory(gameState);

    this.gameState = gameState;
    await this.saveState();

    // 广播结果
    this.broadcast({
      type: "action_result",
      data: {
        action: action.action,
        result: result.data,
        turn: gameState.turn,
        current_player: gameState.current_player,
        winner: gameState.winner,
      }
    });

    return Response.json(result);
  }

  // 移动操作
  private async handleMoveAction(action: ActionRequest, gameState: GameState): Promise<any> {
    const general = this.findGeneral(action.instance_id!, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }

    if (general.owner !== action.player) {
      return { success: false, error: ErrorCodes.NOT_YOUR_TURN };
    }

    const target: Position = { x: action.target_x!, y: action.target_y! };
    const result = executeMove(general, target, gameState);

    if (!result.success) {
      return { success: false, error: { code: 1005, message: result.error } };
    }

    return { success: true, data: { from: result.path![0], to: target, path: result.path } };
  }

  // 攻击操作
  private async handleAttackAction(action: ActionRequest, gameState: GameState): Promise<any> {
    const attacker = this.findGeneral(action.instance_id!, gameState);
    const defender = this.findGeneral(action.target_instance_id!, gameState);

    if (!attacker || !defender) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }

    if (attacker.owner !== action.player) {
      return { success: false, error: ErrorCodes.NOT_YOUR_TURN };
    }

    if (attacker.has_acted) {
      return { success: false, error: ErrorCodes.ALREADY_ACTED };
    }

    if (!attacker.is_alive) {
      return { success: false, error: ErrorCodes.GENERAL_DEAD };
    }

    // 计算战斗结果
    const combatResult = calculateCombat(attacker, defender, gameState);

    // 应用战斗结果
    applyCombatResult(attacker, defender, combatResult, gameState);

    return {
      success: true,
      data: {
        damage_dealt: combatResult.damage,
        counter_damage: combatResult.counter_damage,
        target_remaining_hp: defender.current_hp,
        attacker_remaining_hp: attacker.current_hp,
        target_killed: combatResult.target_killed,
        attacker_killed: combatResult.attacker_killed,
        triggered_skills: combatResult.triggered_skills,
      }
    };
  }

  // 技能操作（诸葛亮神算、郭嘉鬼才等主动技能）
  private async handleSkillAction(action: ActionRequest, gameState: GameState): Promise<any> {
    const general = this.findGeneral(action.instance_id!, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }

    const data = getGeneralById(general.general_id);
    if (!data || data.skill_type !== "active") {
      return { success: false, error: { code: 1008, message: "该武将没有主动技能" } };
    }

    // 诸葛亮神算：指挥友军行动
    if (data.skill_name === "神算" && action.skill_target) {
      const target = this.findGeneral(action.skill_target, gameState);
      if (!target || target.owner !== general.owner) {
        return { success: false, error: { code: 1008, message: "无效的技能目标" } };
      }

      if (manhattanDistance(general.position, target.position) > 2) {
        return { success: false, error: { code: 1008, message: "目标不在技能范围内" } };
      }

      // 标记诸葛亮已行动，允许目标行动
      general.has_acted = true;
      target.has_acted = false;

      return { success: true, data: { skill: "神算", target: action.skill_target } };
    }

    // 郭嘉鬼才：查看敌人意图（主要是信息获取）
    if (data.skill_name === "鬼才") {
      const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
      const nearbyEnemies = enemies.filter(e =>
        e.is_alive && manhattanDistance(general.position, e.position) <= 5
      );

      general.has_acted = true;

      return {
        success: true,
        data: {
          skill: "鬼才",
          visible_enemies: nearbyEnemies.map(e => ({
            instance_id: e.instance_id,
            general_id: e.general_id,
            position: e.position,
            current_hp: e.current_hp,
            buffs: e.buffs,
          }))
        }
      };
    }

    return { success: false, error: { code: 1008, message: "技能执行失败" } };
  }

  // 待命操作
  private async handleWaitAction(action: ActionRequest, gameState: GameState): Promise<any> {
    const general = this.findGeneral(action.instance_id!, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }

    general.has_acted = true;

    return { success: true, data: { action: "WAIT" } };
  }

  // 撤退操作
  private async handleRetreatAction(action: ActionRequest, gameState: GameState): Promise<any> {
    const general = this.findGeneral(action.instance_id!, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }

    // 检查典韦恶来限制
    if (!canRetreat(general, gameState)) {
      return { success: false, error: ErrorCodes.CANNOT_RETREAT };
    }

    // 撤退到出生点
    const spawnArea = getSpawnArea(general.owner);
    general.position = {
      x: Math.floor((spawnArea.x1 + spawnArea.x2) / 2),
      y: Math.floor((spawnArea.y1 + spawnArea.y2) / 2)
    };
    general.has_acted = true;

    return { success: true, data: { action: "RETREAT", new_position: general.position } };
  }

  // 结束回合
  private async handleEndTurnAction(action: ActionRequest, gameState: GameState): Promise<any> {
    // 处理回合结束效果
    const currentGenerals = action.player === "p1" ? gameState.p1_generals : gameState.p2_generals;

    for (const general of currentGenerals) {
      if (!general.is_alive) continue;

      // 更新司马懿隐忍状态
      updateInactiveRounds(general, general.has_acted);

      // 重置行动状态
      general.has_acted = false;
      general.moved_distance = 0;
    }

    // 切换玩家
    gameState.current_player = gameState.current_player === "p1" ? "p2" : "p1";

    // 如果回到P1，增加回合数
    if (gameState.current_player === "p1") {
      gameState.turn++;

      // 处理回合开始效果（灼烧等）
      const burnResults = processBurnDamage(gameState);

      // 更新城池控制
      this.updateCityControl(gameState);
    }

    return { success: true, data: { turn: gameState.turn, current_player: gameState.current_player } };
  }

  // 更新城池控制
  private updateCityControl(gameState: GameState): void {
    const p1InCity = gameState.p1_generals.filter(g => g.is_alive && isInCity(g.position.x, g.position.y));
    const p2InCity = gameState.p2_generals.filter(g => g.is_alive && isInCity(g.position.x, g.position.y));

    if (p1InCity.length > 0 && p2InCity.length === 0) {
      if (gameState.city_holder === "p1") {
        gameState.city_hold_turns++;
      } else {
        gameState.city_holder = "p1";
        gameState.city_hold_turns = 1;
      }
    } else if (p2InCity.length > 0 && p1InCity.length === 0) {
      if (gameState.city_holder === "p2") {
        gameState.city_hold_turns++;
      } else {
        gameState.city_holder = "p2";
        gameState.city_hold_turns = 1;
      }
    } else {
      // 有争夺或无人
      gameState.city_hold_turns = 0;
    }
  }

  // 检查胜负
  private checkVictory(gameState: GameState): void {
    // 检查城池占领胜利
    if (gameState.city_hold_turns >= 10) {
      gameState.winner = gameState.city_holder;
      gameState.win_reason = "占领城池10回合";
      gameState.status = "finished";
      return;
    }

    // 检查全灭胜利
    const p1Alive = gameState.p1_generals.some(g => g.is_alive);
    const p2Alive = gameState.p2_generals.some(g => g.is_alive);

    if (!p1Alive && !p2Alive) {
      gameState.winner = null;
      gameState.win_reason = "双方全灭，平局";
      gameState.status = "finished";
    } else if (!p1Alive) {
      gameState.winner = "p2";
      gameState.win_reason = "消灭所有敌军";
      gameState.status = "finished";
    } else if (!p2Alive) {
      gameState.winner = "p1";
      gameState.win_reason = "消灭所有敌军";
      gameState.status = "finished";
    }

    // 检查回合上限
    if (gameState.turn >= 200 && gameState.status === "playing") {
      // 根据剩余血量判断
      const p1TotalHp = gameState.p1_generals.reduce((sum, g) => sum + (g.is_alive ? g.current_hp : 0), 0);
      const p2TotalHp = gameState.p2_generals.reduce((sum, g) => sum + (g.is_alive ? g.current_hp : 0), 0);

      if (p1TotalHp > p2TotalHp) {
        gameState.winner = "p1";
        gameState.win_reason = "回合上限，血量优势";
      } else if (p2TotalHp > p1TotalHp) {
        gameState.winner = "p2";
        gameState.win_reason = "回合上限，血量优势";
      } else {
        gameState.winner = null;
        gameState.win_reason = "回合上限，平局";
      }
      gameState.status = "finished";
    }
  }

  // 获取游戏状态
  async handleGetState(request: Request): Promise<Response> {
    const player = new URL(request.url).searchParams.get("player") as PlayerSide;

    const gameState = await this.loadState();
    if (!gameState) {
      return Response.json({ success: false, error: ErrorCodes.GAME_NOT_FOUND });
    }

    const filteredState = filterGameStateForPlayer(gameState, player);
    return Response.json({ success: true, data: filteredState });
  }

  // 检查冷却时间
  async handleCheckCooldown(request: Request): Promise<Response> {
    const { playerId } = await request.json() as { playerId: string };

    const key = `cooldown:${playerId}`;
    const cooldownUntil = await this.state.storage.get<number>(key);

    const now = Date.now();

    if (cooldownUntil && now < cooldownUntil) {
      return Response.json({
        allowed: false,
        retryAfter: Math.ceil((cooldownUntil - now) / 1000)
      });
    }

    // 设置新的冷却时间（5秒）
    await this.state.storage.put(key, now + 5000);
    return Response.json({ allowed: true });
  }

  // 获取武将可移动范围
  async handleGetMoveable(request: Request): Promise<Response> {
    const instanceId = new URL(request.url).searchParams.get("instance_id");
    
    if (!instanceId) {
      return Response.json({ success: false, error: { code: 1010, message: "缺少 instance_id 参数" } });
    }

    const gameState = await this.loadState();
    if (!gameState) {
      return Response.json({ success: false, error: ErrorCodes.GAME_NOT_FOUND });
    }

    if (gameState.status !== "playing") {
      return Response.json({ success: false, error: { code: 1008, message: "游戏未在进行中" } });
    }

    const general = this.findGeneral(instanceId, gameState);
    if (!general) {
      return Response.json({ success: false, error: ErrorCodes.INVALID_GENERAL });
    }

    if (!general.is_alive) {
      return Response.json({ success: false, error: ErrorCodes.GENERAL_DEAD });
    }

    // 计算可移动范围
    const moveableArea = getMoveableArea(general, gameState);

    // 转换为更易用的格式
    const positions = moveableArea.positions.map(pos => ({
      x: pos.x,
      y: pos.y,
      cost: moveableArea.costs.get(`${pos.x},${pos.y}`) || 0
    }));

    return Response.json({
      success: true,
      data: {
        instance_id: instanceId,
        current_position: general.position,
        has_acted: general.has_acted,
        moveable_positions: positions,
        total_positions: positions.length
      }
    });
  }

  // 查找武将
  private findGeneral(instanceId: string, gameState: GameState): BattleGeneral | undefined {
    return [...gameState.p1_generals, ...gameState.p2_generals].find(g => g.instance_id === instanceId);
  }

  // 广播消息
  private broadcast(event: WSEvent): void {
    const message = JSON.stringify(event);

    for (const [playerId, ws] of this.connections) {
      try {
        // 根据玩家过滤敏感信息
        if (this.gameState) {
          const playerEvent = {
            ...event,
            data: {
              ...event.data,
              state: filterGameStateForPlayer(this.gameState, playerId as PlayerSide)
            }
          };
          ws.send(JSON.stringify(playerEvent));
        } else {
          ws.send(message);
        }
      } catch (e) {
        this.connections.delete(playerId);
      }
    }
  }

  // 保存状态
  private async saveState(): Promise<void> {
    if (this.gameState) {
      await this.state.storage.put("gameState", this.gameState);
    }
  }

  // 加载状态
  private async loadState(): Promise<GameState | null> {
    if (this.gameState) {
      return this.gameState;
    }
    this.gameState = await this.state.storage.get("gameState") || null;
    return this.gameState;
  }
}
