/**
 * Ability Effects
 * Implements Pokemon 5e ability effect handlers for combat
 * T075-T092: Full ability system implementation
 *
 * Feature: 017-5e-combat-research
 */

import { getProficiencyBonus } from './combatUtils.js';
import { rollDice, rollD20 } from './diceRoller.js';
import { hasStatus, applyStatusEffect, StatusType } from './statusEffects.js';

/**
 * Ability trigger types
 */
export const AbilityTrigger = {
  ON_ENTRY: 'onEntry',
  ON_DAMAGE: 'onDamage',
  ON_DAMAGE_TAKEN: 'onDamageTaken',
  ON_STAB_DAMAGE: 'onStabDamage',
  ON_CRITICAL_HIT: 'onCriticalHit',
  ON_STATUS_INFLICTED: 'onStatusInflicted',
  ON_FAINT: 'onFaint',
  ON_WEATHER_CHANGE: 'onWeatherChange',
  ON_TURN_START: 'onTurnStart',
  ON_TURN_END: 'onTurnEnd',
  ON_SPEED_CALC: 'onSpeedCalc',
  ON_AC_CALC: 'onACCalc'
};

/**
 * T075: Adaptability ability handler
 * When using a move of its own type (STAB), roll damage twice and choose either total
 */
function handleAdaptability(combatant, context) {
  const { move, damageRoll } = context;
  if (!move || !damageRoll) return null;

  // Check if move type matches combatant type (STAB)
  const combatantTypes = (combatant.type || combatant.types || []).map(t => t.toLowerCase());
  const moveType = (move.type || '').toLowerCase();

  if (!combatantTypes.includes(moveType)) {
    return null; // Not STAB, no effect
  }

  // Roll damage a second time
  const secondRoll = rollDice(context.diceExpression || '1d6');

  return {
    effect: 'adaptability_choice',
    description: 'Adaptability: Roll damage twice, choose either',
    roll1: damageRoll,
    roll2: secondRoll,
    chosenRoll: Math.max(damageRoll, secondRoll)
  };
}

/**
 * T076: Battle Armor ability handler
 * Immune to extra damage from critical hits
 */
function handleBattleArmor(combatant, context) {
  if (!context.isCritical) return null;

  return {
    effect: 'critical_immunity',
    description: 'Battle Armor: Immune to critical hit extra damage',
    criticalDamageNegated: context.criticalBonusDamage || 0
  };
}

/**
 * T077: Blaze ability handler
 * Doubles STAB bonus when at 25% HP or less for Fire moves
 */
function handleBlaze(combatant, context) {
  const { move } = context;
  if (!move) return null;

  const moveType = (move.type || '').toLowerCase();
  if (moveType !== 'fire') return null;

  // Check HP threshold
  const hpPercent = combatant.current_hp / (combatant.max_hp || combatant.hp || 1);
  if (hpPercent > 0.25) return null;

  return {
    effect: 'double_stab',
    description: 'Blaze: Double STAB bonus at low HP',
    moveType: 'fire',
    stabMultiplier: 2
  };
}

/**
 * T078: Chlorophyll ability handler
 * Doubles speed in harsh sunlight
 */
function handleChlorophyll(combatant, context) {
  const { weather } = context;
  if (weather !== 'harsh-sunlight') return null;

  return {
    effect: 'double_speed',
    description: 'Chlorophyll: Speed doubled in sunlight',
    speedMultiplier: 2
  };
}

/**
 * T079: Flash Fire ability handler
 * Fire immunity, boosts next Fire move STAB after being hit by Fire
 */
function handleFlashFire(combatant, context) {
  const { incomingMoveType, trigger } = context;

  // On taking fire damage: immunity + charge up
  if (trigger === AbilityTrigger.ON_DAMAGE_TAKEN && incomingMoveType?.toLowerCase() === 'fire') {
    return {
      effect: 'fire_immunity',
      description: 'Flash Fire: Immune to Fire, next Fire move boosted',
      damageNegated: true,
      flashFireCharged: true
    };
  }

  // On dealing fire damage with charge: double STAB
  if (trigger === AbilityTrigger.ON_DAMAGE && combatant.flash_fire_charged) {
    const moveType = (context.move?.type || '').toLowerCase();
    if (moveType === 'fire') {
      return {
        effect: 'flash_fire_boost',
        description: 'Flash Fire: Double STAB on Fire move',
        stabMultiplier: 2,
        consumeCharge: true
      };
    }
  }

  return null;
}

/**
 * T080: Intimidate ability handler
 * Once per short rest, impose disadvantage on enemy attack roll
 */
function handleIntimidate(combatant, context) {
  const { trigger } = context;

  // Check if intimidate is available
  if (combatant.intimidate_used) return null;

  if (trigger === AbilityTrigger.ON_ENTRY) {
    return {
      effect: 'intimidate_available',
      description: 'Intimidate: Can impose disadvantage on one enemy attack (once per short rest)',
      canUse: true
    };
  }

  return null;
}

/**
 * T081: Levitate ability handler
 * Immune to Ground-type moves
 */
function handleLevitate(combatant, context) {
  const { incomingMoveType } = context;

  if (incomingMoveType?.toLowerCase() === 'ground') {
    return {
      effect: 'ground_immunity',
      description: 'Levitate: Immune to Ground moves',
      damageNegated: true
    };
  }

  return null;
}

/**
 * T082: Overgrow ability handler
 * Doubles STAB bonus when at 25% HP or less for Grass moves
 */
function handleOvergrow(combatant, context) {
  const { move } = context;
  if (!move) return null;

  const moveType = (move.type || '').toLowerCase();
  if (moveType !== 'grass') return null;

  const hpPercent = combatant.current_hp / (combatant.max_hp || combatant.hp || 1);
  if (hpPercent > 0.25) return null;

  return {
    effect: 'double_stab',
    description: 'Overgrow: Double STAB bonus at low HP',
    moveType: 'grass',
    stabMultiplier: 2
  };
}

/**
 * T083: Rain Dish ability handler
 * Heals proficiency bonus HP at end of turn in rain
 */
function handleRainDish(combatant, context) {
  const { weather, trigger } = context;

  if (trigger !== AbilityTrigger.ON_TURN_END) return null;
  if (weather !== 'rain') return null;

  const healing = getProficiencyBonus(combatant.level || 1);

  return {
    effect: 'rain_healing',
    description: 'Rain Dish: Heals in rain',
    healing
  };
}

/**
 * T084: Rough Skin ability handler
 * On melee hit received, roll d4, on 4 deal proficiency damage back
 */
function handleRoughSkin(combatant, context) {
  const { trigger, isMelee, attacker } = context;

  if (trigger !== AbilityTrigger.ON_DAMAGE_TAKEN) return null;
  if (!isMelee) return null;

  const roll = rollDice('1d4');
  if (roll !== 4) {
    return {
      effect: 'rough_skin_miss',
      description: 'Rough Skin: No retaliation (d4 roll)',
      roll,
      retaliated: false
    };
  }

  const damage = getProficiencyBonus(combatant.level || 1);

  return {
    effect: 'rough_skin_damage',
    description: 'Rough Skin: Deals damage to melee attacker',
    roll,
    damage,
    targetId: attacker?.combatant_id,
    retaliated: true
  };
}

/**
 * T085: Swift Swim ability handler
 * Doubles speed in rain
 */
function handleSwiftSwim(combatant, context) {
  const { weather } = context;
  if (weather !== 'rain') return null;

  return {
    effect: 'double_speed',
    description: 'Swift Swim: Speed doubled in rain',
    speedMultiplier: 2
  };
}

/**
 * T086: Synchronize ability handler
 * Pass burn/paralysis/poison to attacker
 */
function handleSynchronize(combatant, context) {
  const { trigger, statusApplied, attacker, roundNumber } = context;

  if (trigger !== AbilityTrigger.ON_STATUS_INFLICTED) return null;
  if (!attacker) return null;

  // Only for burn, paralysis, poison
  const syncStatuses = [StatusType.BURNED, StatusType.PARALYZED, StatusType.POISONED];
  if (!syncStatuses.includes(statusApplied)) return null;

  return {
    effect: 'synchronize_status',
    description: `Synchronize: Passes ${statusApplied} to attacker`,
    statusToApply: statusApplied,
    targetId: attacker.combatant_id
  };
}

/**
 * T087: Thick Fat ability handler
 * Takes half damage from Fire and Ice moves
 */
function handleThickFat(combatant, context) {
  const { incomingMoveType, trigger } = context;

  if (trigger !== AbilityTrigger.ON_DAMAGE_TAKEN) return null;

  const moveType = incomingMoveType?.toLowerCase();
  if (moveType !== 'fire' && moveType !== 'ice') return null;

  return {
    effect: 'damage_reduction',
    description: 'Thick Fat: Half damage from Fire/Ice',
    damageMultiplier: 0.5,
    affectedType: moveType
  };
}

/**
 * T088: Torrent ability handler
 * Doubles STAB bonus when at 25% HP or less for Water moves
 */
function handleTorrent(combatant, context) {
  const { move } = context;
  if (!move) return null;

  const moveType = (move.type || '').toLowerCase();
  if (moveType !== 'water') return null;

  const hpPercent = combatant.current_hp / (combatant.max_hp || combatant.hp || 1);
  if (hpPercent > 0.25) return null;

  return {
    effect: 'double_stab',
    description: 'Torrent: Double STAB bonus at low HP',
    moveType: 'water',
    stabMultiplier: 2
  };
}

/**
 * T089: Water Absorb ability handler
 * Water immunity, heals for half the damage that would have been dealt
 */
function handleWaterAbsorb(combatant, context) {
  const { incomingMoveType, incomingDamage, trigger } = context;

  if (trigger !== AbilityTrigger.ON_DAMAGE_TAKEN) return null;

  if (incomingMoveType?.toLowerCase() !== 'water') return null;

  const healing = Math.floor((incomingDamage || 0) / 2);

  return {
    effect: 'water_absorb',
    description: 'Water Absorb: Immune to Water, heals instead',
    damageNegated: true,
    healing
  };
}

/**
 * T075-T089: Ability handlers registry
 * Maps ability IDs to their effect handlers
 */
export const ABILITY_HANDLERS = {
  'adaptability': {
    triggers: [AbilityTrigger.ON_STAB_DAMAGE],
    handler: handleAdaptability,
    description: 'Roll STAB damage twice, choose either total'
  },
  'battle-armor': {
    triggers: [AbilityTrigger.ON_CRITICAL_HIT],
    handler: handleBattleArmor,
    description: 'Immune to critical hit extra damage'
  },
  'blaze': {
    triggers: [AbilityTrigger.ON_DAMAGE],
    handler: handleBlaze,
    description: 'Double STAB for Fire moves at 25% HP or less'
  },
  'chlorophyll': {
    triggers: [AbilityTrigger.ON_SPEED_CALC],
    handler: handleChlorophyll,
    description: 'Speed doubled in harsh sunlight'
  },
  'flash-fire': {
    triggers: [AbilityTrigger.ON_DAMAGE_TAKEN, AbilityTrigger.ON_DAMAGE],
    handler: handleFlashFire,
    description: 'Fire immunity, boosts next Fire move'
  },
  'intimidate': {
    triggers: [AbilityTrigger.ON_ENTRY],
    handler: handleIntimidate,
    description: 'Once per short rest, impose disadvantage on enemy attack'
  },
  'levitate': {
    triggers: [AbilityTrigger.ON_DAMAGE_TAKEN],
    handler: handleLevitate,
    description: 'Immune to Ground moves'
  },
  'overgrow': {
    triggers: [AbilityTrigger.ON_DAMAGE],
    handler: handleOvergrow,
    description: 'Double STAB for Grass moves at 25% HP or less'
  },
  'rain-dish': {
    triggers: [AbilityTrigger.ON_TURN_END],
    handler: handleRainDish,
    description: 'Heal proficiency bonus HP in rain at end of turn'
  },
  'rough-skin': {
    triggers: [AbilityTrigger.ON_DAMAGE_TAKEN],
    handler: handleRoughSkin,
    description: 'On d4 roll of 4, deal proficiency damage to melee attacker'
  },
  'swift-swim': {
    triggers: [AbilityTrigger.ON_SPEED_CALC],
    handler: handleSwiftSwim,
    description: 'Speed doubled in rain'
  },
  'synchronize': {
    triggers: [AbilityTrigger.ON_STATUS_INFLICTED],
    handler: handleSynchronize,
    description: 'Pass burn/paralysis/poison to attacker'
  },
  'thick-fat': {
    triggers: [AbilityTrigger.ON_DAMAGE_TAKEN],
    handler: handleThickFat,
    description: 'Half damage from Fire and Ice moves'
  },
  'torrent': {
    triggers: [AbilityTrigger.ON_DAMAGE],
    handler: handleTorrent,
    description: 'Double STAB for Water moves at 25% HP or less'
  },
  'water-absorb': {
    triggers: [AbilityTrigger.ON_DAMAGE_TAKEN],
    handler: handleWaterAbsorb,
    description: 'Immune to Water, heal for half damage instead'
  }
};

/**
 * T090: Trigger an ability effect
 * @param {Object} combatant - Combatant with the ability
 * @param {string} trigger - Trigger type from AbilityTrigger
 * @param {Object} context - Context for the ability (damage, attacker, etc.)
 * @returns {Object|null} Effect result or null if no effect
 */
export function triggerAbility(combatant, trigger, context = {}) {
  if (!combatant || !combatant.ability_id) {
    return null;
  }

  const handler = ABILITY_HANDLERS[combatant.ability_id];
  if (!handler) {
    return null;
  }

  // Check if this trigger applies to this ability
  if (!handler.triggers.includes(trigger)) {
    return null;
  }

  // Call the handler with context including trigger
  const effectContext = { ...context, trigger };
  const result = handler.handler(combatant, effectContext);

  if (result) {
    result.ability_id = combatant.ability_id;
    result.combatant_id = combatant.combatant_id;
  }

  return result;
}

/**
 * Check if a combatant has a specific ability
 * @param {Object} combatant - Combatant to check
 * @param {string} abilityId - Ability ID to check for
 * @returns {boolean} True if combatant has the ability
 */
export function hasAbility(combatant, abilityId) {
  if (!combatant) return false;

  // Check single ability_id field
  if (combatant.ability_id === abilityId) {
    return true;
  }

  // Check abilities array (legacy support)
  if (combatant.abilities && Array.isArray(combatant.abilities)) {
    return combatant.abilities.includes(abilityId);
  }

  return false;
}

/**
 * T092: Get damage modifier from ability
 * Called during damage calculation to apply ability effects
 * @param {Object} attacker - Attacking combatant
 * @param {Object} defender - Defending combatant
 * @param {Object} move - Move being used
 * @param {Object} context - Battle context (weather, etc.)
 * @returns {{ multiplier: number, advantage: boolean, disadvantage: boolean, stabMultiplier: number, blocked: boolean, healing: number }}
 */
export function getAbilityDamageModifier(attacker, defender, move, context = {}) {
  const result = {
    multiplier: 1,
    advantage: false,
    disadvantage: false,
    stabMultiplier: 1,
    blocked: false,
    healing: 0,
    effects: []
  };

  if (!move) return result;

  const moveType = (move.type || '').toLowerCase();

  // Check attacker abilities (damage dealing)
  if (attacker?.ability_id) {
    const attackerEffect = triggerAbility(attacker, AbilityTrigger.ON_DAMAGE, {
      move,
      weather: context.weather,
      defender
    });

    if (attackerEffect) {
      result.effects.push(attackerEffect);

      if (attackerEffect.stabMultiplier) {
        result.stabMultiplier = Math.max(result.stabMultiplier, attackerEffect.stabMultiplier);
      }
      if (attackerEffect.advantage) {
        result.advantage = true;
      }
    }
  }

  // Check defender abilities (damage taking)
  if (defender?.ability_id) {
    const defenderEffect = triggerAbility(defender, AbilityTrigger.ON_DAMAGE_TAKEN, {
      incomingMoveType: moveType,
      incomingDamage: context.incomingDamage,
      isMelee: context.isMelee,
      attacker
    });

    if (defenderEffect) {
      result.effects.push(defenderEffect);

      if (defenderEffect.damageNegated) {
        result.blocked = true;
      }
      if (defenderEffect.damageMultiplier) {
        result.multiplier *= defenderEffect.damageMultiplier;
      }
      if (defenderEffect.healing) {
        result.healing = defenderEffect.healing;
      }
    }
  }

  return result;
}

/**
 * T091: Process ability triggers for combat events
 * @param {Object} combatant - Combatant whose ability may trigger
 * @param {string} event - Event type (entry, damage, faint, etc.)
 * @param {Object} battleState - Current battle state
 * @param {Object} context - Additional context
 * @returns {Object[]} Array of ability effect results
 */
export function processAbilityTriggers(combatant, event, battleState, context = {}) {
  const results = [];

  if (!combatant?.ability_id) return results;

  // Map event names to triggers
  const eventToTrigger = {
    'entry': AbilityTrigger.ON_ENTRY,
    'damage_dealt': AbilityTrigger.ON_DAMAGE,
    'damage_taken': AbilityTrigger.ON_DAMAGE_TAKEN,
    'critical_hit': AbilityTrigger.ON_CRITICAL_HIT,
    'status_inflicted': AbilityTrigger.ON_STATUS_INFLICTED,
    'faint': AbilityTrigger.ON_FAINT,
    'turn_start': AbilityTrigger.ON_TURN_START,
    'turn_end': AbilityTrigger.ON_TURN_END,
    'speed_calc': AbilityTrigger.ON_SPEED_CALC
  };

  const trigger = eventToTrigger[event];
  if (!trigger) return results;

  const effectContext = {
    ...context,
    weather: battleState?.weather?.type,
    terrain: battleState?.terrain?.type
  };

  const effect = triggerAbility(combatant, trigger, effectContext);
  if (effect) {
    results.push(effect);
  }

  return results;
}

/**
 * Get speed multiplier from abilities for a combatant
 * @param {Object} combatant - Combatant to check
 * @param {Object} battleState - Current battle state
 * @returns {number} Speed multiplier (1 = normal, 2 = doubled)
 */
export function getAbilitySpeedMultiplier(combatant, battleState) {
  if (!combatant?.ability_id) return 1;

  const effect = triggerAbility(combatant, AbilityTrigger.ON_SPEED_CALC, {
    weather: battleState?.weather?.type
  });

  if (effect?.speedMultiplier) {
    return effect.speedMultiplier;
  }

  return 1;
}

/**
 * Check if an ability blocks a specific type of damage
 * @param {Object} defender - Defending combatant
 * @param {string} moveType - Type of incoming move
 * @returns {{ blocked: boolean, healing: number, reason: string|null }}
 */
export function checkAbilityImmunity(defender, moveType) {
  if (!defender?.ability_id) {
    return { blocked: false, healing: 0, reason: null };
  }

  const effect = triggerAbility(defender, AbilityTrigger.ON_DAMAGE_TAKEN, {
    incomingMoveType: moveType
  });

  if (effect?.damageNegated) {
    return {
      blocked: true,
      healing: effect.healing || 0,
      reason: effect.description
    };
  }

  return { blocked: false, healing: 0, reason: null };
}
