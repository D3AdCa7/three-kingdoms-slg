import { BattleGeneral, GameState, Position, Buff, PlayerSide, Direction } from "../types";
import { getGeneralById } from "../data/generals";
import { isInCity, manhattanDistance, getAdjacentPositions, isInArea, CITY_AREA } from "../data/map";

// 技能效果接口
export interface SkillEffect {
  atkBonus: number;
  defBonus: number;
  defPenalty: number; // 对敌人防御的削减
  damageMultiplier: number;
  ignoreDefense: number; // 无视防御点数
  extraDamage: number;
  counterBonus: number;
  triggered: string[];
  special: SpecialSkillEffect[];
}

export interface SpecialSkillEffect {
  type: string;
  target: string;
  value: any;
}

// 创建默认技能效果
function defaultSkillEffect(): SkillEffect {
  return {
    atkBonus: 0,
    defBonus: 0,
    defPenalty: 0,
    damageMultiplier: 1,
    ignoreDefense: 0,
    extraDamage: 0,
    counterBonus: 0,
    triggered: [],
    special: [],
  };
}

// 获取攻击时的技能效果
export function getAttackSkillEffects(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): SkillEffect {
  const effect = defaultSkillEffect();
  const attackerData = getGeneralById(attacker.general_id);
  const defenderData = getGeneralById(defender.general_id);
  
  if (!attackerData || !defenderData) return effect;
  
  // === 攻击者技能 ===
  
  // 关羽 - 武圣：攻击无视1点防御
  if (attackerData.skill_name === "武圣") {
    effect.ignoreDefense += 1;
    effect.triggered.push("武圣");
  }
  
  // 张飞 - 咆哮：HP<3时攻击+2
  if (attackerData.skill_name === "咆哮" && attacker.current_hp < 3) {
    effect.atkBonus += 2;
    effect.triggered.push("咆哮");
  }
  
  // 马超 - 铁骑：本回合移动≥3格后攻击+2
  if (attackerData.skill_name === "铁骑") {
    const movedDistance = attacker.moved_distance || 0;
    if (movedDistance >= 3) {
      effect.atkBonus += 2;
      effect.triggered.push("铁骑");
    }
  }
  
  // 孙策 - 霸王：周围2格内只有1个敌人时攻击+3
  if (attackerData.skill_name === "霸王") {
    const nearbyEnemies = countNearbyEnemies(attacker, gameState, 2);
    if (nearbyEnemies === 1) {
      effect.atkBonus += 3;
      effect.triggered.push("霸王");
    }
  }
  
  // 甘宁 - 突袭：从敌人背后攻击时伤害×2
  if (attackerData.skill_name === "突袭") {
    if (isAttackingFromBehind(attacker, defender)) {
      effect.damageMultiplier *= 2;
      effect.triggered.push("突袭");
    }
  }
  
  // 黄盖 - 苦肉：每损失1点HP，攻击+1
  if (attackerData.skill_name === "苦肉") {
    const lostHp = attackerData.base_hp - attacker.current_hp;
    if (lostHp > 0) {
      effect.atkBonus += lostHp;
      effect.triggered.push("苦肉");
    }
  }
  
  // 徐晃 - 断粮：攻击位于己方出生区到城池连线上的敌人时伤害+2
  if (attackerData.skill_name === "断粮") {
    if (isOnSupplyLine(defender.position, attacker.owner)) {
      effect.extraDamage += 2;
      effect.triggered.push("断粮");
    }
  }
  
  // 吕布 - 无双：攻击时无视所有被动减伤效果
  if (attackerData.skill_name === "无双") {
    effect.special.push({ type: "ignore_damage_reduction", target: defender.instance_id, value: true });
    effect.triggered.push("无双");
  }
  
  // 张辽 - 威震：对每个敌人的首次攻击使其防御-1
  if (attackerData.skill_name === "威震") {
    const attackKey = `${attacker.instance_id}_${defender.instance_id}`;
    if (!gameState.attacked_enemies[attackKey]) {
      effect.defPenalty += 1;
      effect.special.push({ type: "mark_attacked", target: attackKey, value: true });
      effect.triggered.push("威震");
    }
  }
  
  // 司马懿 - 隐忍：连续3回合不移动不攻击后，攻防各+2
  if (attackerData.skill_name === "隐忍") {
    const inactiveRounds = attacker.skill_state.inactive_rounds || 0;
    if (inactiveRounds >= 3) {
      effect.atkBonus += 2;
      effect.triggered.push("隐忍(攻击)");
    }
    // 攻击后重置计数
    effect.special.push({ type: "reset_inactive", target: attacker.instance_id, value: true });
  }
  
  // === 刘备 - 仁德：相邻友军攻击+1 (作为队友的buff) ===
  const adjacentAllies = getAdjacentAllies(attacker, gameState);
  for (const ally of adjacentAllies) {
    const allyData = getGeneralById(ally.general_id);
    if (allyData?.skill_name === "仁德") {
      effect.atkBonus += 1;
      effect.triggered.push("仁德(刘备)");
      break; // 只触发一次
    }
  }
  
  return effect;
}

// 获取防御时的技能效果
export function getDefenseSkillEffects(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState,
  ignoreReduction: boolean = false
): SkillEffect {
  const effect = defaultSkillEffect();
  const defenderData = getGeneralById(defender.general_id);
  const attackerData = getGeneralById(attacker.general_id);
  
  if (!defenderData || !attackerData) return effect;
  
  // 如果吕布无双触发，跳过所有被动减伤
  if (ignoreReduction) {
    return effect;
  }
  
  // 曹仁 - 坚守：在城池内时额外防御+1
  if (defenderData.skill_name === "坚守") {
    if (isInCity(defender.position.x, defender.position.y)) {
      effect.defBonus += 1;
      effect.triggered.push("坚守");
    }
  }
  
  // 姜维 - 胆略：每场战斗首次受伤减免1点
  if (defenderData.skill_name === "胆略") {
    if (!gameState.first_damage_taken[defender.instance_id]) {
      effect.defBonus += 1;
      effect.special.push({ type: "mark_first_damage", target: defender.instance_id, value: true });
      effect.triggered.push("胆略");
    }
  }
  
  // 司马懿 - 隐忍：连续3回合不移动不攻击后，攻防各+2
  if (defenderData.skill_name === "隐忍") {
    const inactiveRounds = defender.skill_state.inactive_rounds || 0;
    if (inactiveRounds >= 3) {
      effect.defBonus += 2;
      effect.triggered.push("隐忍(防御)");
    }
  }
  
  // 孙权 - 制衡：相邻友军共享最高防御值
  const adjacentAllies = getAdjacentAllies(defender, gameState);
  for (const ally of adjacentAllies) {
    const allyData = getGeneralById(ally.general_id);
    if (allyData?.skill_name === "制衡") {
      // 找出相邻友军中最高的防御
      const maxDef = Math.max(
        defenderData.base_def + defender.def_modifier,
        ...adjacentAllies.map(a => {
          const d = getGeneralById(a.general_id);
          return d ? d.base_def + a.def_modifier : 0;
        })
      );
      const currentDef = defenderData.base_def + defender.def_modifier;
      if (maxDef > currentDef) {
        effect.defBonus += maxDef - currentDef;
        effect.triggered.push("制衡(孙权)");
      }
      break;
    }
  }
  
  return effect;
}

// 获取反击时的技能效果
export function getCounterAttackSkillEffects(
  attacker: BattleGeneral, // 原来的攻击者，现在被反击
  defender: BattleGeneral, // 原来的防御者，现在反击
  gameState: GameState
): SkillEffect {
  const effect = defaultSkillEffect();
  const defenderData = getGeneralById(defender.general_id);
  
  if (!defenderData) return effect;
  
  // 魏延 - 反骨：被攻击时反击伤害+1
  if (defenderData.skill_name === "反骨") {
    effect.counterBonus += 1;
    effect.triggered.push("反骨");
  }
  
  return effect;
}

// 检查是否触发反伤技能
export function getThornsEffects(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  damage: number
): SpecialSkillEffect[] {
  const effects: SpecialSkillEffect[] = [];
  const defenderData = getGeneralById(defender.general_id);
  
  if (!defenderData) return effects;
  
  // 夏侯惇 - 刚烈：受到伤害时对攻击者造成1点反伤
  if (defenderData.skill_name === "刚烈" && damage > 0) {
    effects.push({
      type: "thorns_damage",
      target: attacker.instance_id,
      value: 1,
    });
  }
  
  return effects;
}

// 检查击杀后触发的技能
export function getKillSkillEffects(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): SpecialSkillEffect[] {
  const effects: SpecialSkillEffect[] = [];
  const attackerData = getGeneralById(attacker.general_id);
  
  if (!attackerData) return effects;
  
  // 曹操 - 奸雄：击杀敌人回复1HP
  if (attackerData.skill_name === "奸雄") {
    effects.push({
      type: "heal",
      target: attacker.instance_id,
      value: 1,
    });
  }
  
  // 赵云 - 龙胆：击杀后可再移动2格
  if (attackerData.skill_name === "龙胆") {
    effects.push({
      type: "extra_move",
      target: attacker.instance_id,
      value: 2,
    });
  }
  
  return effects;
}

// 攻击后触发的效果
export function getPostAttackEffects(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): SpecialSkillEffect[] {
  const effects: SpecialSkillEffect[] = [];
  const attackerData = getGeneralById(attacker.general_id);
  
  if (!attackerData) return effects;
  
  // 周瑜 - 火攻：攻击后目标获得"灼烧"状态
  if (attackerData.skill_name === "火攻" && defender.is_alive) {
    effects.push({
      type: "apply_burn",
      target: defender.instance_id,
      value: 1, // 1点伤害
    });
  }
  
  // 庞统 - 连环：攻击时对目标相邻的1个敌人造成1点溅射伤害
  if (attackerData.skill_name === "连环") {
    const adjacentEnemies = getAdjacentEnemies(defender, gameState);
    if (adjacentEnemies.length > 0) {
      // 随机选择一个（或选择第一个）
      effects.push({
        type: "splash_damage",
        target: adjacentEnemies[0].instance_id,
        value: 1,
      });
    }
  }
  
  return effects;
}

// 获取武将的攻击范围
export function getAttackRange(general: BattleGeneral): number {
  const data = getGeneralById(general.general_id);
  if (!data) return 1;
  
  // 黄忠 - 百步：攻击范围3格
  if (data.skill_name === "百步") {
    return 3;
  }
  
  // 陆逊 - 营烧：攻击范围+1格
  if (data.skill_name === "营烧") {
    return 2;
  }
  
  // 太史慈 - 神射：可远程攻击
  if (data.skill_name === "神射") {
    return 3;
  }
  
  // 弓手类型默认2格（虽然上面已经特殊处理了）
  if (data.type === "弓手") {
    return 2;
  }
  
  return 1; // 默认近战
}

// 检查是否免除反击
export function isCounterAttackImmune(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  distance: number
): boolean {
  const attackerData = getGeneralById(attacker.general_id);
  if (!attackerData) return false;
  
  // 太史慈 - 神射：远程攻击(2-3格)时不受反击
  if (attackerData.skill_name === "神射" && distance >= 2) {
    return true;
  }
  
  // 远程攻击不触发反击（距离>=2）
  if (distance >= 2) {
    return true;
  }
  
  return false;
}

// 检查是否可以撤退
export function canRetreat(general: BattleGeneral, gameState: GameState): boolean {
  // 检查是否被典韦恶来限制
  const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  
  for (const enemy of enemies) {
    if (!enemy.is_alive) continue;
    const enemyData = getGeneralById(enemy.general_id);
    if (enemyData?.skill_name === "恶来") {
      const dist = manhattanDistance(general.position, enemy.position);
      if (dist === 1) {
        return false; // 被典韦限制
      }
    }
  }
  
  return true;
}

// 检查是否可以斜向移动
export function canMoveDiagonally(general: BattleGeneral): boolean {
  const data = getGeneralById(general.general_id);
  if (!data) return false;
  
  // 张郃 - 巧变：可斜向移动
  return data.skill_name === "巧变";
}

// 检查是否可以穿越敌方单位
export function canPassThroughEnemy(general: BattleGeneral): boolean {
  const data = getGeneralById(general.general_id);
  if (!data) return false;
  
  // 吕蒙 - 白衣：移动时可穿越敌方单位
  return data.skill_name === "白衣";
}

// 处理回合开始的技能效果
export function processRoundStartEffects(gameState: GameState): SpecialSkillEffect[] {
  const effects: SpecialSkillEffect[] = [];
  const allGenerals = [...gameState.p1_generals, ...gameState.p2_generals];
  
  for (const general of allGenerals) {
    if (!general.is_alive) continue;
    
    // 处理灼烧效果
    const burnBuff = general.buffs.find(b => b.type === "burn");
    if (burnBuff) {
      effects.push({
        type: "burn_damage",
        target: general.instance_id,
        value: burnBuff.value,
      });
    }
  }
  
  return effects;
}

// 处理回合结束的技能效果
export function processRoundEndEffects(gameState: GameState): SpecialSkillEffect[] {
  const effects: SpecialSkillEffect[] = [];
  
  // 减少buff持续时间，移除过期buff
  const allGenerals = [...gameState.p1_generals, ...gameState.p2_generals];
  for (const general of allGenerals) {
    general.buffs = general.buffs.filter(buff => {
      if (buff.duration === -1) return true; // 永久buff
      buff.duration--;
      return buff.duration > 0;
    });
  }
  
  return effects;
}

// 更新司马懿隐忍状态
export function updateInactiveRounds(general: BattleGeneral, acted: boolean): void {
  const data = getGeneralById(general.general_id);
  if (data?.skill_name !== "隐忍") return;
  
  if (acted) {
    general.skill_state.inactive_rounds = 0;
  } else {
    general.skill_state.inactive_rounds = (general.skill_state.inactive_rounds || 0) + 1;
  }
}

// === 辅助函数 ===

// 获取相邻友军
function getAdjacentAllies(general: BattleGeneral, gameState: GameState): BattleGeneral[] {
  const allies = general.owner === "p1" ? gameState.p1_generals : gameState.p2_generals;
  const adjacentPositions = getAdjacentPositions(general.position);
  
  return allies.filter(ally => 
    ally.instance_id !== general.instance_id &&
    ally.is_alive &&
    adjacentPositions.some(p => p.x === ally.position.x && p.y === ally.position.y)
  );
}

// 获取相邻敌军
function getAdjacentEnemies(general: BattleGeneral, gameState: GameState): BattleGeneral[] {
  const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  const adjacentPositions = getAdjacentPositions(general.position);
  
  return enemies.filter(enemy => 
    enemy.is_alive &&
    adjacentPositions.some(p => p.x === enemy.position.x && p.y === enemy.position.y)
  );
}

// 统计附近敌人数量
function countNearbyEnemies(general: BattleGeneral, gameState: GameState, range: number): number {
  const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  
  return enemies.filter(enemy => 
    enemy.is_alive &&
    manhattanDistance(general.position, enemy.position) <= range
  ).length;
}

// 检查是否从背后攻击
function isAttackingFromBehind(attacker: BattleGeneral, defender: BattleGeneral): boolean {
  const dx = attacker.position.x - defender.position.x;
  const dy = attacker.position.y - defender.position.y;
  
  // 确定攻击方向
  let attackDirection: Direction;
  if (Math.abs(dx) > Math.abs(dy)) {
    attackDirection = dx > 0 ? "right" : "left";
  } else {
    attackDirection = dy > 0 ? "down" : "up";
  }
  
  // 检查是否是背后（敌人面朝方向的反方向）
  const behindMap: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  
  return attackDirection === behindMap[defender.facing];
}

// 检查是否在补给线上（徐晃断粮）
function isOnSupplyLine(pos: Position, attackerOwner: PlayerSide): boolean {
  // P1补给线：从(0,0)到(50,50)的路线
  // P2补给线：从(99,99)到(50,50)的路线
  
  if (attackerOwner === "p1") {
    // 对P1来说，敌人在P2的补给线上有利
    // P2补给线大致是从(99,99)到城池(50,50)
    // 简化：在y >= x - 10 && y <= x + 10 && x >= 50 的区域
    return pos.x >= 50 && pos.x <= 99 && Math.abs(pos.x - pos.y) <= 15;
  } else {
    // 对P2来说，敌人在P1的补给线上有利
    // P1补给线大致是从(0,0)到城池(50,50)
    return pos.x >= 0 && pos.x <= 50 && Math.abs(pos.x - pos.y) <= 15;
  }
}

// 应用灼烧buff
export function applyBurnBuff(general: BattleGeneral): void {
  // 移除旧的灼烧，添加新的
  general.buffs = general.buffs.filter(b => b.type !== "burn");
  general.buffs.push({
    type: "burn",
    value: 1,
    duration: 1,
    source: "火攻",
  });
}

// 诸葛亮神算 - 获取可指挥的友军
export function getCommandableAllies(
  zhugeLiang: BattleGeneral,
  gameState: GameState
): BattleGeneral[] {
  const data = getGeneralById(zhugeLiang.general_id);
  if (data?.skill_name !== "神算") return [];
  
  const allies = zhugeLiang.owner === "p1" ? gameState.p1_generals : gameState.p2_generals;
  
  return allies.filter(ally => 
    ally.instance_id !== zhugeLiang.instance_id &&
    ally.is_alive &&
    !ally.has_acted &&
    manhattanDistance(zhugeLiang.position, ally.position) <= 2
  );
}

// 郭嘉鬼才 - 获取可查看的敌人（暂时只返回范围内敌人，实际意图需要AI系统支持）
export function getVisibleEnemyIntents(
  guojia: BattleGeneral,
  gameState: GameState
): { enemy: BattleGeneral; intent: string }[] {
  const data = getGeneralById(guojia.general_id);
  if (data?.skill_name !== "鬼才") return [];
  
  const enemies = guojia.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  
  return enemies
    .filter(enemy => 
      enemy.is_alive &&
      manhattanDistance(guojia.position, enemy.position) <= 5
    )
    .map(enemy => ({
      enemy,
      intent: "unknown", // 实际意图需要AI系统提供
    }));
}
