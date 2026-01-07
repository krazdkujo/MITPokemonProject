/**
 * Status Effects Utility
 * Manages Pokemon status conditions per Pokemon 5e rules
 *
 * Feature: 007-combat-engine
 */

import { v4 as uuidv4 } from 'uuid';
import { getProficiencyBonus, getAttributeModifier } from './combatUtils.js';
import { rollD20, rollDice } from './diceRoller.js';

// Status type constants
const StatusType = {
  ASLEEP: 'ASLEEP',
  BURNED: 'BURNED',
  FROZEN: 'FROZEN',
  PARALYZED: 'PARALYZED',
  POISONED: 'POISONED',
  BADLY_POISONED: 'BADLY_POISONED',
  CONFUSED: 'CONFUSED',
  FLINCHED: 'FLINCHED',
  DISABLED: 'DISABLED',
  TAUNTED: 'TAUNTED',
  // Feature 024 T018: Additional status types for complete move coverage
  PRONE: 'PRONE',
  BLINDED: 'BLINDED',
  CHARMED: 'CHARMED',
  FRIGHTENED: 'FRIGHTENED',
  RESTRAINED: 'RESTRAINED',
  GRAPPLED: 'GRAPPLED',
  INFATUATED: 'INFATUATED',
  CURSED: 'CURSED',
  TRAPPED: 'TRAPPED'
};

// Status definitions with volatility, duration, and tick damage rules
const STATUS_DEFINITIONS = {
  [StatusType.ASLEEP]: {
    isVolatile: true,
    defaultDuration: 3,
    tickDamage: false,
    wakeCheck: true, // Roll d20, 11+ ends it
    typeImmunities: []
  },
  [StatusType.BURNED]: {
    isVolatile: false,
    defaultDuration: null, // Until cured
    tickDamage: true, // Prof bonus damage at end of turn
    tickDamageMultiplier: 1,
    typeImmunities: ['fire']
  },
  [StatusType.FROZEN]: {
    isVolatile: false,
    defaultDuration: null, // Until cured or fire damage
    tickDamage: false,
    typeImmunities: ['ice']
  },
  [StatusType.PARALYZED]: {
    isVolatile: false,
    defaultDuration: null, // Until cured
    tickDamage: false,
    startOfTurnCheck: true, // Roll d4, 1 = skip turn
    typeImmunities: ['electric']
  },
  [StatusType.POISONED]: {
    isVolatile: false,
    defaultDuration: null, // Until cured
    tickDamage: true, // Prof bonus damage at end of turn
    tickDamageMultiplier: 1,
    typeImmunities: ['poison', 'steel']
  },
  [StatusType.BADLY_POISONED]: {
    isVolatile: false,
    defaultDuration: null, // Until cured
    tickDamage: true, // 2x prof bonus damage at end of turn
    tickDamageMultiplier: 2,
    typeImmunities: ['poison', 'steel']
  },
  [StatusType.CONFUSED]: {
    isVolatile: true,
    defaultDuration: 3,
    tickDamage: false,
    confusionCheck: true, // Roll d8 for behavior
    typeImmunities: []
  },
  [StatusType.FLINCHED]: {
    isVolatile: true,
    defaultDuration: 1, // Until end of next turn
    tickDamage: false,
    typeImmunities: []
  },
  [StatusType.DISABLED]: {
    isVolatile: true,
    defaultDuration: 10, // 1 minute (concentration)
    tickDamage: false,
    typeImmunities: [],
    disablesLastMove: true // Prevents use of last activated move
  },
  [StatusType.TAUNTED]: {
    isVolatile: true,
    defaultDuration: 10, // 1 minute (concentration)
    tickDamage: false,
    typeImmunities: [],
    forceDamagingMoves: true // Can only use damaging attacks
  },
  // Feature 024 T019: Additional status definitions for complete move coverage
  [StatusType.PRONE]: {
    isVolatile: true,
    defaultDuration: 1, // Until creature uses movement to stand
    tickDamage: false,
    typeImmunities: [],
    movementCost: 'half', // Costs half movement to stand up
    attackDisadvantage: true, // Attacks made while prone have disadvantage
    meleeAdvantage: true // Melee attacks against prone have advantage
  },
  [StatusType.BLINDED]: {
    isVolatile: true,
    defaultDuration: 1,
    tickDamage: false,
    typeImmunities: [],
    autoFailSight: true, // Auto-fail sight-based checks
    attackDisadvantage: true, // All attacks have disadvantage
    attackersAdvantage: true // Attackers have advantage
  },
  [StatusType.CHARMED]: {
    isVolatile: true,
    defaultDuration: 10, // 1 minute typically
    tickDamage: false,
    typeImmunities: [],
    cannotAttackCharmer: true, // Cannot attack the charmer
    charmerAdvantage: true // Charmer has advantage on social checks
  },
  [StatusType.FRIGHTENED]: {
    isVolatile: true,
    defaultDuration: 10, // 1 minute typically
    tickDamage: false,
    typeImmunities: ['dark'], // Dark types are immune (thematic)
    attackDisadvantage: true, // Disadvantage on attacks while source is visible
    cannotApproach: true // Cannot willingly move closer to source
  },
  [StatusType.RESTRAINED]: {
    isVolatile: true,
    defaultDuration: null, // Until escape
    tickDamage: false,
    typeImmunities: [],
    speedZero: true, // Speed becomes 0
    attackDisadvantage: true, // Attacks have disadvantage
    attackersAdvantage: true, // Attackers have advantage
    dexSaveDisadvantage: true // DEX saves have disadvantage
  },
  [StatusType.GRAPPLED]: {
    isVolatile: true,
    defaultDuration: null, // Until escape or grappler lets go
    tickDamage: false,
    typeImmunities: [],
    speedZero: true // Speed becomes 0
  },
  [StatusType.INFATUATED]: {
    isVolatile: true,
    defaultDuration: 10, // 1 minute
    tickDamage: false,
    typeImmunities: [],
    attackCheck: true // 50% chance to not attack (d4 roll)
  },
  [StatusType.CURSED]: {
    isVolatile: false,
    defaultDuration: null, // Until cured
    tickDamage: true,
    tickDamageMultiplier: 0.5, // Half proficiency damage
    typeImmunities: ['ghost'] // Ghost types immune
  },
  [StatusType.TRAPPED]: {
    isVolatile: true,
    defaultDuration: 5, // Combat duration
    tickDamage: false,
    typeImmunities: ['ghost'], // Ghost types can phase through
    cannotFlee: true, // Cannot switch out or flee
    cannotSwitch: true
  }
};

/**
 * Parse move description for status effect triggers
 * @param {string} description - Move description text
 * @param {number} naturalRoll - The natural d20 roll (for threshold checks)
 * @param {Object} saveResult - Optional save result { saved, total, dc } for "fail by X" checks
 * @returns {{ statusType: string|null, threshold: number|null, onHit: boolean, onSave: boolean, failBy: number|null, triggerType: string|null }}
 */
function parseStatusTrigger(description, naturalRoll, saveResult = null) {
  if (!description) {
    return { statusType: null, threshold: null, onHit: false, onSave: false, failBy: null, triggerType: null };
  }

  const descLower = description.toLowerCase();
  let statusType = null;
  let threshold = null;
  let onHit = false;
  let onSave = false;
  let failBy = null;
  let triggerType = null;

  // Detect status keywords
  if (descLower.includes('burned') || descLower.includes('burnt') || descLower.includes('burning')) {
    statusType = StatusType.BURNED;
  } else if (descLower.includes('paralyzed') || descLower.includes('paralysis')) {
    statusType = StatusType.PARALYZED;
  } else if (descLower.includes('poisoned') || descLower.includes('poison')) {
    statusType = StatusType.POISONED;
  } else if (descLower.includes('asleep') || descLower.includes('sleep') || descLower.includes('falling asleep') || descLower.includes('put to sleep')) {
    statusType = StatusType.ASLEEP;
  } else if (descLower.includes('frozen') || descLower.includes('freeze')) {
    statusType = StatusType.FROZEN;
  } else if (descLower.includes('confused') || descLower.includes('confusion')) {
    statusType = StatusType.CONFUSED;
  } else if (descLower.includes('flinch') || descLower.includes('flinches')) {
    statusType = StatusType.FLINCHED;
  } else if (descLower.includes('disable') || descLower.includes('disabled')) {
    statusType = StatusType.DISABLED;
  } else if (descLower.includes('taunt') && (descLower.includes('only') || descLower.includes('damaging'))) {
    statusType = StatusType.TAUNTED;
  // Feature 024 T018: Additional status detection
  } else if (descLower.includes('prone') || descLower.includes('knock') && descLower.includes('down')) {
    statusType = StatusType.PRONE;
  } else if (descLower.includes('blinded') || descLower.includes('blind')) {
    statusType = StatusType.BLINDED;
  } else if (descLower.includes('charmed') || descLower.includes('charm')) {
    statusType = StatusType.CHARMED;
  } else if (descLower.includes('frightened') || descLower.includes('fear') || descLower.includes('terrified')) {
    statusType = StatusType.FRIGHTENED;
  } else if (descLower.includes('restrained') || descLower.includes('restrain')) {
    statusType = StatusType.RESTRAINED;
  } else if (descLower.includes('grappled') || descLower.includes('grapple')) {
    statusType = StatusType.GRAPPLED;
  } else if (descLower.includes('infatuated') || descLower.includes('infatuation') || descLower.includes('attract')) {
    statusType = StatusType.INFATUATED;
  } else if (descLower.includes('cursed') || descLower.includes('curse')) {
    statusType = StatusType.CURSED;
  } else if (descLower.includes('trapped') || descLower.includes('cannot flee') || descLower.includes("can't escape")) {
    statusType = StatusType.TRAPPED;
  }

  if (!statusType) {
    return { statusType: null, threshold: null, onHit: false, onSave: false, failBy: null, triggerType: null };
  }

  // Check for "fail by X or more" patterns (e.g., "fails the save by 5 or more")
  const failByPatterns = [
    /fail(?:s|ed)?\s+(?:the\s+)?save\s+by\s+(\d+)\s+or\s+more/i,
    /fail(?:s|ed)?\s+by\s+(\d+)\s+or\s+more/i
  ];

  for (const pattern of failByPatterns) {
    const match = description.match(pattern);
    if (match) {
      failBy = parseInt(match[1], 10);
      onSave = true;
      triggerType = 'save_fail_by';
      break;
    }
  }

  // Check for natural roll threshold patterns
  // Patterns: "natural attack roll of 19 or 20", "natural roll 15 or higher", "18 or more"
  if (!failBy) {
    const thresholdPatterns = [
      /natural\s+(?:attack\s+)?roll\s+(?:of\s+)?(\d+)\s*(?:or\s+(?:higher|more|20))?/i,
      /(?:natural\s+)?(?:attack\s+)?roll\s+(?:of\s+)?(\d+)\s+or\s+(?:higher|more)/i
    ];

    for (const pattern of thresholdPatterns) {
      const match = descLower.match(pattern);
      if (match) {
        threshold = parseInt(match[1], 10);
        triggerType = 'natural_roll';
        break;
      }
    }
  }

  // Check for "on a hit" pattern
  if (descLower.includes('on a hit') || descLower.includes('on hit')) {
    onHit = true;
    if (!triggerType) triggerType = 'on_hit';
  }

  // Check for save-based application (simple fail, not "fail by")
  if (!failBy && descLower.includes('save') && (descLower.includes('fail') || descLower.includes('failure'))) {
    onSave = true;
    if (!triggerType) triggerType = 'save_fail';
  }

  // Evaluate trigger conditions
  // For natural roll threshold
  if (threshold !== null && naturalRoll !== null) {
    if (naturalRoll < threshold) {
      return { statusType: null, threshold, onHit, onSave, failBy, triggerType };
    }
  }

  // For "fail by X" check
  if (failBy !== null && saveResult) {
    const { saved, total, dc } = saveResult;
    if (saved) {
      // Saved, so no status
      return { statusType: null, threshold, onHit, onSave, failBy, triggerType };
    }
    // Check if failed by enough
    const margin = dc - total;
    if (margin < failBy) {
      // Failed but not by enough
      return { statusType: null, threshold, onHit, onSave, failBy, triggerType, failedByMargin: margin };
    }
    // Failed by enough - return with margin info
    return { statusType, threshold, onHit, onSave, failBy, triggerType, failedByMargin: margin };
  }

  return { statusType, threshold, onHit, onSave, failBy, triggerType };
}

/**
 * Check if a Pokemon type grants immunity to a status
 * @param {string} statusType - The status type to check
 * @param {string[]} defenderTypes - Array of defender's types
 * @returns {boolean} True if defender is immune
 */
function checkStatusImmunity(statusType, defenderTypes) {
  if (!defenderTypes || !Array.isArray(defenderTypes)) {
    return false;
  }

  const definition = STATUS_DEFINITIONS[statusType];
  if (!definition || !definition.typeImmunities) {
    return false;
  }

  const defenderTypesLower = defenderTypes.map(t => t.toLowerCase());
  return definition.typeImmunities.some(immuneType =>
    defenderTypesLower.includes(immuneType)
  );
}

/**
 * Create a new status effect object
 * @param {string} statusType - The type of status
 * @param {number} roundNumber - Current round number
 * @param {string} sourceCombatantId - Who applied this effect (optional)
 * @returns {Object} StatusEffect object
 */
function createStatusEffect(statusType, roundNumber, sourceCombatantId = null) {
  const definition = STATUS_DEFINITIONS[statusType];
  if (!definition) {
    return null;
  }

  return {
    effect_id: uuidv4(),
    status_type: statusType,
    is_volatile: definition.isVolatile,
    remaining_rounds: definition.defaultDuration,
    applied_at_round: roundNumber,
    source_combatant_id: sourceCombatantId,
    grace_period_until: null
  };
}

/**
 * Check if a status can be applied to a combatant
 * @param {Object} combatant - The combatant to check
 * @param {string} statusType - The status type to apply
 * @param {number} currentRound - Current round number
 * @returns {{ canApply: boolean, reason: string }}
 */
function canApplyStatus(combatant, statusType, currentRound) {
  const definition = STATUS_DEFINITIONS[statusType];
  if (!definition) {
    return { canApply: false, reason: 'invalid_status_type' };
  }

  // Check type immunity
  if (checkStatusImmunity(statusType, combatant.type)) {
    return { canApply: false, reason: 'type_immunity' };
  }

  // Check if already has a non-volatile status (can't stack non-volatiles)
  if (!definition.isVolatile) {
    const existingNonVolatile = (combatant.status_effects || []).find(
      s => !STATUS_DEFINITIONS[s.status_type]?.isVolatile
    );
    if (existingNonVolatile) {
      return { canApply: false, reason: 'already_has_non_volatile_status' };
    }
  }

  // Check grace period
  const existingGrace = (combatant.status_effects || []).find(
    s => s.status_type === statusType &&
         s.grace_period_until !== null &&
         currentRound <= s.grace_period_until
  );
  if (existingGrace) {
    return { canApply: false, reason: 'grace_period' };
  }

  return { canApply: true, reason: null };
}

/**
 * Apply a status effect to a combatant
 * @param {Object} combatant - The combatant to apply status to
 * @param {string} statusType - The status type
 * @param {number} roundNumber - Current round number
 * @param {string} sourceCombatantId - Who applied the status (optional)
 * @returns {{ applied: boolean, statusChange: Object }}
 */
function applyStatusEffect(combatant, statusType, roundNumber, sourceCombatantId = null) {
  const { canApply, reason } = canApplyStatus(combatant, statusType, roundNumber);

  if (!canApply) {
    return {
      applied: false,
      statusChange: {
        combatant_id: combatant.combatant_id,
        status_type: statusType,
        change: 'blocked',
        reason: reason
      }
    };
  }

  const effect = createStatusEffect(statusType, roundNumber, sourceCombatantId);
  if (!combatant.status_effects) {
    combatant.status_effects = [];
  }
  combatant.status_effects.push(effect);

  return {
    applied: true,
    statusChange: {
      combatant_id: combatant.combatant_id,
      status_type: statusType,
      change: 'applied',
      reason: null
    }
  };
}

/**
 * Remove all volatile status effects from a combatant
 * @param {Object} combatant - The combatant
 * @param {string} reason - Reason for removal (e.g., "switched_out", "combat_ended")
 * @returns {Object[]} Array of StatusChange objects for removed statuses
 */
function removeVolatileStatuses(combatant, reason) {
  if (!combatant.status_effects || combatant.status_effects.length === 0) {
    return [];
  }

  const changes = [];
  const remaining = [];

  for (const effect of combatant.status_effects) {
    const definition = STATUS_DEFINITIONS[effect.status_type];
    if (definition?.isVolatile) {
      changes.push({
        combatant_id: combatant.combatant_id,
        status_type: effect.status_type,
        change: 'removed',
        reason: reason
      });
    } else {
      remaining.push(effect);
    }
  }

  combatant.status_effects = remaining;
  return changes;
}

/**
 * Process end-of-turn status effects (Burn/Poison tick damage)
 * @param {Object} combatant - The combatant
 * @returns {{ damages: Object[], statusChanges: Object[], rolls: Object[] }}
 */
function processEndOfTurnStatus(combatant) {
  const damages = [];
  const statusChanges = [];
  const rolls = []; // Track wake check rolls

  if (!combatant.status_effects || combatant.status_effects.length === 0) {
    return { damages, statusChanges, rolls };
  }

  for (const effect of combatant.status_effects) {
    const definition = STATUS_DEFINITIONS[effect.status_type];

    // Process tick damage
    if (definition?.tickDamage) {
      const profBonus = getProficiencyBonus(combatant.level);
      const multiplier = definition.tickDamageMultiplier || 1;
      const tickDamage = profBonus * multiplier;
      const hpBefore = combatant.current_hp;
      combatant.current_hp = Math.max(0, combatant.current_hp - tickDamage);
      const fainted = combatant.current_hp === 0;

      damages.push({
        combatant_id: combatant.combatant_id,
        combatant_name: combatant.name,
        source: effect.status_type,
        statusType: effect.status_type,
        damage: tickDamage,
        profBonus,
        multiplier,
        hpBefore,
        hpAfter: combatant.current_hp,
        fainted
      });
    }

    // Process duration countdown for volatile effects
    if (definition?.isVolatile && effect.remaining_rounds !== null) {
      effect.remaining_rounds--;

      // Check for sleep wake roll
      if (effect.status_type === StatusType.ASLEEP && definition.wakeCheck) {
        const wakeRoll = rollD20();
        const threshold = 11;
        const wokeUp = wakeRoll >= threshold;

        rolls.push({
          checkType: 'wake',
          statusType: StatusType.ASLEEP,
          diceExpr: 'd20',
          roll: wakeRoll,
          threshold,
          passed: wokeUp,
          result: wokeUp ? 'woke_up' : 'still_asleep'
        });

        if (wokeUp) {
          statusChanges.push({
            combatant_id: combatant.combatant_id,
            combatant_name: combatant.name,
            status_type: effect.status_type,
            change: 'removed',
            reason: 'woke_up',
            roll: wakeRoll,
            threshold
          });
          effect.remaining_rounds = 0;
        }
      }

      if (effect.remaining_rounds <= 0) {
        statusChanges.push({
          combatant_id: combatant.combatant_id,
          combatant_name: combatant.name,
          status_type: effect.status_type,
          change: 'removed',
          reason: 'duration_expired'
        });
      }
    }
  }

  // Remove expired effects
  combatant.status_effects = combatant.status_effects.filter(
    e => e.remaining_rounds === null || e.remaining_rounds > 0
  );

  return { damages, statusChanges, rolls };
}

/**
 * Process start-of-turn status effects (Paralysis skip check, etc.)
 * @param {Object} combatant - The combatant
 * @returns {{ skipTurn: boolean, reason: string|null, statusChanges: Object[], rolls: Object[] }}
 */
function processStartOfTurnStatus(combatant) {
  const statusChanges = [];
  const rolls = []; // Track all status check rolls for logging
  let skipTurn = false;
  let reason = null;

  if (!combatant.status_effects || combatant.status_effects.length === 0) {
    return { skipTurn, reason, statusChanges, rolls };
  }

  for (const effect of combatant.status_effects) {
    const definition = STATUS_DEFINITIONS[effect.status_type];

    // Paralysis check: d4, 1 = skip turn
    if (effect.status_type === StatusType.PARALYZED && definition.startOfTurnCheck) {
      const paraCheck = rollDice('1d4');
      rolls.push({
        checkType: 'paralysis',
        statusType: StatusType.PARALYZED,
        diceExpr: '1d4',
        roll: paraCheck,
        threshold: 1,
        passed: paraCheck !== 1,
        result: paraCheck === 1 ? 'cannot_move' : 'can_move'
      });
      if (paraCheck === 1) {
        skipTurn = true;
        reason = 'paralyzed';
      }
    }

    // Sleep: already incapacitated (wake check happens at end of turn)
    if (effect.status_type === StatusType.ASLEEP) {
      skipTurn = true;
      reason = 'asleep';
      rolls.push({
        checkType: 'asleep',
        statusType: StatusType.ASLEEP,
        diceExpr: null,
        roll: null,
        threshold: null,
        passed: false,
        result: 'fast_asleep'
      });
    }

    // Frozen: incapacitated (break check happens separately)
    if (effect.status_type === StatusType.FROZEN) {
      skipTurn = true;
      reason = 'frozen';
      rolls.push({
        checkType: 'frozen',
        statusType: StatusType.FROZEN,
        diceExpr: null,
        roll: null,
        threshold: null,
        passed: false,
        result: 'frozen_solid'
      });
    }
  }

  return { skipTurn, reason, statusChanges, rolls };
}

/**
 * Check if a combatant has a specific status
 * @param {Object} combatant - The combatant
 * @param {string} statusType - Status type to check
 * @returns {boolean}
 */
function hasStatus(combatant, statusType) {
  if (!combatant.status_effects) return false;
  return combatant.status_effects.some(e => e.status_type === statusType);
}

/**
 * T018: Apply Burned damage penalty
 * Per Pokemon 5e rules: Roll damage twice, take the lower result
 * @param {string} diceExpression - Damage dice expression (e.g., "2d6")
 * @param {Function} rollFn - Dice rolling function
 * @returns {{ roll1: number, roll2: number, result: number }}
 */
function applyBurnedDamagePenalty(diceExpression, rollFn = rollDice) {
  const roll1 = rollFn(diceExpression);
  const roll2 = rollFn(diceExpression);
  return {
    roll1,
    roll2,
    result: Math.min(roll1, roll2)
  };
}

/**
 * T019: Get Flinched combat modifiers
 * Per Pokemon 5e rules:
 * - Disadvantage on all attack rolls, ability checks, and saving throws until end of next turn
 * - If creature uses action requiring saving throw, targets have advantage
 * @param {Object} combatant - Combatant to check
 * @returns {{ hasDisadvantage: boolean, targetsGetAdvantage: boolean }}
 */
function getFlinchedEffects(combatant) {
  if (!hasStatus(combatant, StatusType.FLINCHED)) {
    return { hasDisadvantage: false, targetsGetAdvantage: false };
  }
  return {
    hasDisadvantage: true,
    targetsGetAdvantage: true
  };
}

/**
 * T020: Attempt to break Frozen status
 * Per Pokemon 5e rules: STR save DC = 10 + proficiency of creature that caused the condition
 * @param {Object} combatant - Frozen combatant
 * @returns {{ broke: boolean, roll: number, dc: number, strMod: number }}
 */
function attemptBreakFrozen(combatant) {
  if (!hasStatus(combatant, StatusType.FROZEN)) {
    return { broke: false, roll: null, dc: null, strMod: null };
  }

  // Find the frozen status effect to get applier proficiency
  const frozenEffect = combatant.status_effects?.find(e => e.status_type === StatusType.FROZEN);

  // Get applier proficiency from status_metadata or default to +2
  let applierProf = 2; // Default proficiency
  if (combatant.status_metadata?.[StatusType.FROZEN]?.applier_proficiency) {
    applierProf = combatant.status_metadata[StatusType.FROZEN].applier_proficiency;
  } else if (frozenEffect?.source_combatant_id && combatant.status_metadata?.applier_proficiency) {
    applierProf = combatant.status_metadata.applier_proficiency;
  }

  const dc = 10 + applierProf;
  const strMod = getAttributeModifier(combatant.attributes?.str || 10);
  const roll = rollD20();
  const total = roll + strMod;
  const broke = total >= dc;

  return {
    broke,
    roll,
    total,
    dc,
    strMod
  };
}

/**
 * T021: Process Confused behavior
 * Per Pokemon 5e rules with d8 roll:
 * - 1-4: Creature chooses its behavior (normal)
 * - 5: Doesn't move or take actions
 * - 6: Takes Struggle action against itself, automatically hits
 * - 7: Takes Struggle action against nearest Pokemon target
 * - 8: Condition ends
 * @param {Object} combatant - Confused combatant
 * @returns {{ behavior: string, roll: number, endsConfusion: boolean }}
 */
function processConfusedBehavior(combatant) {
  if (!hasStatus(combatant, StatusType.CONFUSED)) {
    return { behavior: 'normal', roll: null, endsConfusion: false };
  }

  const roll = rollDice('1d8');

  switch (roll) {
    case 1:
    case 2:
    case 3:
    case 4:
      return { behavior: 'normal', roll, endsConfusion: false };
    case 5:
      return { behavior: 'skip', roll, endsConfusion: false };
    case 6:
      return { behavior: 'self-struggle', roll, endsConfusion: false };
    case 7:
      return { behavior: 'nearest-struggle', roll, endsConfusion: false };
    case 8:
      return { behavior: 'end-confusion', roll, endsConfusion: true };
    default:
      return { behavior: 'normal', roll, endsConfusion: false };
  }
}

/**
 * Check if a combatant should have disadvantage on damage rolls due to Burned
 * @param {Object} combatant - Combatant to check
 * @returns {boolean} True if burned
 */
function hasBurnedDamagePenalty(combatant) {
  return hasStatus(combatant, StatusType.BURNED);
}

/**
 * Store applier proficiency when applying a status
 * Used for Frozen DC calculation
 * @param {Object} combatant - Combatant receiving status
 * @param {string} statusType - Type of status
 * @param {number} applierProficiency - Proficiency of the applier
 */
function setStatusApplierProficiency(combatant, statusType, applierProficiency) {
  if (!combatant.status_metadata) {
    combatant.status_metadata = {};
  }
  if (!combatant.status_metadata[statusType]) {
    combatant.status_metadata[statusType] = {};
  }
  combatant.status_metadata[statusType].applier_proficiency = applierProficiency;
}

/**
 * Remove a specific status effect from a combatant
 * @param {Object} combatant - Combatant to modify
 * @param {string} statusType - Status type to remove
 * @param {string} reason - Reason for removal
 * @returns {Object} Status change object
 */
function removeStatus(combatant, statusType, reason) {
  if (!combatant.status_effects) {
    return null;
  }

  const index = combatant.status_effects.findIndex(e => e.status_type === statusType);
  if (index === -1) {
    return null;
  }

  combatant.status_effects.splice(index, 1);

  // Clear status metadata
  if (combatant.status_metadata?.[statusType]) {
    delete combatant.status_metadata[statusType];
  }

  return {
    combatant_id: combatant.combatant_id,
    status_type: statusType,
    change: 'removed',
    reason
  };
}

export {
  StatusType,
  STATUS_DEFINITIONS,
  parseStatusTrigger,
  checkStatusImmunity,
  createStatusEffect,
  canApplyStatus,
  applyStatusEffect,
  removeVolatileStatuses,
  processEndOfTurnStatus,
  processStartOfTurnStatus,
  hasStatus,
  // New 5e-compliant functions (T018-T021)
  applyBurnedDamagePenalty,
  getFlinchedEffects,
  attemptBreakFrozen,
  processConfusedBehavior,
  hasBurnedDamagePenalty,
  setStatusApplierProficiency,
  removeStatus
};
