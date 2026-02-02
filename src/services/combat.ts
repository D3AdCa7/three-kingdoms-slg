import { BattleGeneral, GameState, CombatResult, SpecialEffect, Position } from "../types";
import { getGeneralById } from "../data/generals";
import { getTerrain, manhattanDistance } from "../data/map";
import {
  getAttackSkillEffects,
  getDefenseSkillEffects,
  getCounterAttackSkillEffects,
  getThornsEffects,
  getKillSkillEffects,
  getPostAttackEffects,
  getAttackRange,
  isCounterAttackImmune,
  applyBurnBuff,
} from "./skill";

// 计算战斗结果
export function calculateCombat(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): CombatResult {
  const attackerData = getGeneralById(attacker.general_id);
  const defenderData = getGeneralById(defender.general_id);
  
  if (!attackerData || !defenderData) {
    throw new Error("Invalid general data");
  }
  
  const triggeredSkills: string[] = [];
  const specialEffects: SpecialEffect[] = [];
  
  // 获取距离
  const distance = manhattanDistance(attacker.position, defender.position);
  
  // 获取地形防御加成
  const terrain = getTerrain(defender.position.x, defender.position.y);
  
  // === 计算攻击伤害 ===
  
  // 获取攻击者技能效果
  const attackSkillEffects = getAttackSkillEffects(attacker, defender, gameState);
  triggeredSkills.push(...attackSkillEffects.triggered);
  
  // 检查是否无视减伤（吕布无双）
  const ignoreReduction = attackSkillEffects.special.some(e => e.type === "ignore_damage_reduction");
  
  // 获取防御者技能效果
  const defenseSkillEffects = getDefenseSkillEffects(attacker, defender, gameState, ignoreReduction);
  triggeredSkills.push(...defenseSkillEffects.triggered);
  
  // 基础攻击力
  let atk = attackerData.base_atk + attacker.atk_modifier + attackSkillEffects.atkBonus;
  
  // 基础防御力
  let def = defenderData.base_def + defender.def_modifier + terrain.def_bonus;
  def += defenseSkillEffects.defBonus;
  def -= attackSkillEffects.defPenalty;
  def -= attackSkillEffects.ignoreDefense;
  def = Math.max(0, def); // 防御不能为负
  
  // 基础伤害
  let damage = Math.max(1, atk - def);
  
  // 应用伤害倍率
  damage = Math.floor(damage * attackSkillEffects.damageMultiplier);
  
  // 应用额外伤害
  damage += attackSkillEffects.extraDamage;
  
  // 确保最少1点伤害
  damage = Math.max(1, damage);
  
  // === 计算反击伤害 ===
  
  let counterDamage = 0;
  
  // 检查是否免疫反击
  if (!isCounterAttackImmune(attacker, defender, distance) && defender.current_hp > damage) {
    // 获取反击技能效果
    const counterSkillEffects = getCounterAttackSkillEffects(attacker, defender, gameState);
    triggeredSkills.push(...counterSkillEffects.triggered);
    
    // 反击伤害 = 基础攻击 - 防御 / 2
    const counterAtk = defenderData.base_atk + defender.atk_modifier;
    const counterDef = attackerData.base_def + attacker.def_modifier;
    const baseDamage = Math.max(1, counterAtk - counterDef);
    counterDamage = Math.floor(baseDamage / 2) + counterSkillEffects.counterBonus;
    counterDamage = Math.max(0, counterDamage);
  }
  
  // === 判断是否击杀 ===
  
  const targetKilled = defender.current_hp <= damage;
  const attackerKilled = attacker.current_hp <= counterDamage;
  
  // === 收集特殊效果 ===
  
  // 处理标记攻击（张辽威震）
  for (const effect of attackSkillEffects.special) {
    if (effect.type === "mark_attacked") {
      specialEffects.push({
        type: "mark_attacked",
        target: effect.target,
        value: effect.value,
      });
    }
    if (effect.type === "reset_inactive") {
      specialEffects.push({
        type: "reset_inactive",
        target: effect.target,
        value: effect.value,
      });
    }
  }
  
  // 处理姜维胆略标记
  for (const effect of defenseSkillEffects.special) {
    if (effect.type === "mark_first_damage") {
      specialEffects.push({
        type: "mark_first_damage",
        target: effect.target,
        value: effect.value,
      });
    }
  }
  
  // 处理反伤（夏侯惇刚烈）
  const thornsEffects = getThornsEffects(attacker, defender, damage);
  for (const effect of thornsEffects) {
    specialEffects.push(effect);
    triggeredSkills.push("刚烈");
  }
  
  // 处理击杀后效果
  if (targetKilled) {
    const killEffects = getKillSkillEffects(attacker, defender, gameState);
    specialEffects.push(...killEffects);
    for (const effect of killEffects) {
      if (effect.type === "heal") triggeredSkills.push("奸雄");
      if (effect.type === "extra_move") triggeredSkills.push("龙胆");
    }
  }
  
  // 处理攻击后效果（灼烧、连环）
  const postAttackEffects = getPostAttackEffects(attacker, defender, gameState);
  specialEffects.push(...postAttackEffects);
  for (const effect of postAttackEffects) {
    if (effect.type === "apply_burn") triggeredSkills.push("火攻");
    if (effect.type === "splash_damage") triggeredSkills.push("连环");
  }
  
  return {
    damage,
    counter_damage: counterDamage,
    attacker_killed: attackerKilled,
    target_killed: targetKilled,
    triggered_skills: [...new Set(triggeredSkills)], // 去重
    special_effects: specialEffects,
  };
}

// 应用战斗结果到游戏状态
export function applyCombatResult(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  result: CombatResult,
  gameState: GameState
): void {
  // 应用伤害
  defender.current_hp -= result.damage;
  if (defender.current_hp <= 0) {
    defender.current_hp = 0;
    defender.is_alive = false;
  }
  
  // 应用反击伤害
  if (result.counter_damage > 0) {
    attacker.current_hp -= result.counter_damage;
    if (attacker.current_hp <= 0) {
      attacker.current_hp = 0;
      attacker.is_alive = false;
    }
  }
  
  // 应用特殊效果
  for (const effect of result.special_effects) {
    applySpecialEffect(effect, attacker, defender, gameState);
  }
  
  // 标记已行动
  attacker.has_acted = true;
  
  // 更新面朝方向
  updateFacing(attacker, defender.position);
  if (defender.is_alive) {
    updateFacing(defender, attacker.position);
  }
}

// 应用特殊效果
function applySpecialEffect(
  effect: SpecialEffect,
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): void {
  switch (effect.type) {
    case "mark_attacked":
      // 标记张辽已攻击过该敌人
      gameState.attacked_enemies[effect.target] = true;
      break;
      
    case "mark_first_damage":
      // 标记姜维已受到首次伤害
      gameState.first_damage_taken[effect.target] = true;
      break;
      
    case "reset_inactive":
      // 重置司马懿隐忍计数
      const general = findGeneralById(gameState, effect.target);
      if (general) {
        general.skill_state.inactive_rounds = 0;
      }
      break;
      
    case "thorns_damage":
      // 夏侯惇刚烈反伤
      attacker.current_hp -= effect.value;
      if (attacker.current_hp <= 0) {
        attacker.current_hp = 0;
        attacker.is_alive = false;
      }
      break;
      
    case "heal":
      // 曹操奸雄回血
      const attackerData = getGeneralById(attacker.general_id);
      if (attackerData) {
        attacker.current_hp = Math.min(attackerData.base_hp, attacker.current_hp + effect.value);
      }
      break;
      
    case "extra_move":
      // 赵云龙胆额外移动（存储在skill_state中，由movement服务处理）
      attacker.skill_state.extra_move = effect.value;
      break;
      
    case "apply_burn":
      // 周瑜火攻灼烧
      applyBurnBuff(defender);
      break;
      
    case "splash_damage":
      // 庞统连环溅射
      const splashTarget = findGeneralById(gameState, effect.target);
      if (splashTarget && splashTarget.is_alive) {
        splashTarget.current_hp -= effect.value;
        if (splashTarget.current_hp <= 0) {
          splashTarget.current_hp = 0;
          splashTarget.is_alive = false;
        }
      }
      break;
  }
}

// 更新面朝方向
function updateFacing(general: BattleGeneral, targetPos: Position): void {
  const dx = targetPos.x - general.position.x;
  const dy = targetPos.y - general.position.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    general.facing = dx > 0 ? "right" : "left";
  } else {
    general.facing = dy > 0 ? "down" : "up";
  }
}

// 根据ID查找武将
function findGeneralById(gameState: GameState, instanceId: string): BattleGeneral | undefined {
  return [...gameState.p1_generals, ...gameState.p2_generals].find(g => g.instance_id === instanceId);
}

// 检查是否可以攻击目标
export function canAttack(
  attacker: BattleGeneral,
  defender: BattleGeneral,
  gameState: GameState
): { canAttack: boolean; reason?: string } {
  // 检查攻击者是否存活
  if (!attacker.is_alive) {
    return { canAttack: false, reason: "攻击者已阵亡" };
  }
  
  // 检查目标是否存活
  if (!defender.is_alive) {
    return { canAttack: false, reason: "目标已阵亡" };
  }
  
  // 检查是否已行动
  if (attacker.has_acted) {
    return { canAttack: false, reason: "武将已行动" };
  }
  
  // 检查是否是敌人
  if (attacker.owner === defender.owner) {
    return { canAttack: false, reason: "不能攻击友军" };
  }
  
  // 检查攻击范围
  const distance = manhattanDistance(attacker.position, defender.position);
  const attackRange = getAttackRange(attacker);
  
  if (distance > attackRange) {
    return { canAttack: false, reason: `目标不在攻击范围内（范围${attackRange}格）` };
  }
  
  if (distance === 0) {
    return { canAttack: false, reason: "目标不能在同一位置" };
  }
  
  return { canAttack: true };
}

// 处理回合开始的灼烧伤害
export function processBurnDamage(gameState: GameState): { target: string; damage: number }[] {
  const results: { target: string; damage: number }[] = [];
  const allGenerals = [...gameState.p1_generals, ...gameState.p2_generals];
  
  for (const general of allGenerals) {
    if (!general.is_alive) continue;
    
    const burnBuff = general.buffs.find(b => b.type === "burn");
    if (burnBuff) {
      general.current_hp -= burnBuff.value;
      results.push({ target: general.instance_id, damage: burnBuff.value });
      
      if (general.current_hp <= 0) {
        general.current_hp = 0;
        general.is_alive = false;
      }
      
      // 移除灼烧buff
      general.buffs = general.buffs.filter(b => b.type !== "burn");
    }
  }
  
  return results;
}

// 获取武将的有效攻击力（包含所有加成）
export function getEffectiveAttack(general: BattleGeneral, gameState: GameState): number {
  const data = getGeneralById(general.general_id);
  if (!data) return 0;
  
  let atk = data.base_atk + general.atk_modifier;
  
  // 张飞咆哮
  if (data.skill_name === "咆哮" && general.current_hp < 3) {
    atk += 2;
  }
  
  // 黄盖苦肉
  if (data.skill_name === "苦肉") {
    atk += data.base_hp - general.current_hp;
  }
  
  // 司马懿隐忍
  if (data.skill_name === "隐忍" && (general.skill_state.inactive_rounds || 0) >= 3) {
    atk += 2;
  }
  
  return atk;
}

// 获取武将的有效防御（包含所有加成）
export function getEffectiveDefense(general: BattleGeneral, gameState: GameState): number {
  const data = getGeneralById(general.general_id);
  if (!data) return 0;
  
  const terrain = getTerrain(general.position.x, general.position.y);
  let def = data.base_def + general.def_modifier + terrain.def_bonus;
  
  // 曹仁坚守
  if (data.skill_name === "坚守" && terrain.type === "city") {
    def += 1;
  }
  
  // 司马懿隐忍
  if (data.skill_name === "隐忍" && (general.skill_state.inactive_rounds || 0) >= 3) {
    def += 2;
  }
  
  return def;
}
