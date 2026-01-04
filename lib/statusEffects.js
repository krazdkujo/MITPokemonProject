/**
 * Status Effects Utility
 * Manages Pokemon status conditions per Pokemon 5e rules
 *
 * Feature: 007-combat-engine
 */

import { v4 as uuidv4 } from 'uuid';
import { getProficiencyBonus } from './combatUtils.js';
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
  FLINCHED: 'FLINCHED'
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
  }
};

/**
 * Parse move description for status effect triggers
 * @param {string} description - Move description text
 * @param {number} naturalRoll - The natural d20 roll (for threshold checks)
 * @returns {{ statusType: string|null, threshold: number|null, onHit: boolean, onSave: boolean }}
 */
function parseStatusTrigger(description, naturalRoll) {
  if (!description) {
    return { statusType: null, threshold: null, onHit: false, onSave: false };
  }

  const descLower = description.toLowerCase();
  let statusType = null;
  let threshold = null;
  let onHit = false;
  let onSave = false;

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
  }

  if (!statusType) {
    return { statusType: null, threshold: null, onHit: false, onSave: false };
  }

  // Check for natural roll threshold patterns
  // Patterns: "natural attack roll of 19 or 20", "natural roll 15 or higher", "18 or more"
  const thresholdPatterns = [
    /natural\s+(?:attack\s+)?roll\s+(?:of\s+)?(\d+)\s*(?:or\s+(?:higher|more|20))?/i,
    /(?:natural\s+)?(?:attack\s+)?roll\s+(?:of\s+)?(\d+)\s+or\s+(?:higher|more)/i,
    /(\d+)\s+or\s+(?:higher|more)/i
  ];

  for (const pattern of thresholdPatterns) {
    const match = descLower.match(pattern);
    if (match) {
      threshold = parseInt(match[1], 10);
      break;
    }
  }

  // Check for "on a hit" pattern
  if (descLower.includes('on a hit') || descLower.includes('on hit')) {
    onHit = true;
  }

  // Check for save-based application
  if (descLower.includes('save') && (descLower.includes('fail') || descLower.includes('failure'))) {
    onSave = true;
  }

  // If there's a threshold, check if roll meets it
  if (threshold !== null && naturalRoll !== null) {
    if (naturalRoll < threshold) {
      return { statusType: null, threshold, onHit, onSave };
    }
  }

  return { statusType, threshold, onHit, onSave };
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
 * @returns {{ damages: Object[], statusChanges: Object[] }}
 */
function processEndOfTurnStatus(combatant) {
  const damages = [];
  const statusChanges = [];

  if (!combatant.status_effects || combatant.status_effects.length === 0) {
    return { damages, statusChanges };
  }

  for (const effect of combatant.status_effects) {
    const definition = STATUS_DEFINITIONS[effect.status_type];

    // Process tick damage
    if (definition?.tickDamage) {
      const tickDamage = getProficiencyBonus(combatant.level) * (definition.tickDamageMultiplier || 1);
      const hpBefore = combatant.current_hp;
      combatant.current_hp = Math.max(0, combatant.current_hp - tickDamage);

      damages.push({
        combatant_id: combatant.combatant_id,
        source: effect.status_type.toLowerCase(),
        damage: tickDamage,
        hp_before: hpBefore,
        hp_after: combatant.current_hp
      });
    }

    // Process duration countdown for volatile effects
    if (definition?.isVolatile && effect.remaining_rounds !== null) {
      effect.remaining_rounds--;

      // Check for sleep wake roll
      if (effect.status_type === StatusType.ASLEEP && definition.wakeCheck) {
        const wakeRoll = rollD20();
        if (wakeRoll >= 11) {
          statusChanges.push({
            combatant_id: combatant.combatant_id,
            status_type: effect.status_type,
            change: 'removed',
            reason: 'woke_up'
          });
          effect.remaining_rounds = 0;
        }
      }

      if (effect.remaining_rounds <= 0) {
        statusChanges.push({
          combatant_id: combatant.combatant_id,
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

  return { damages, statusChanges };
}

/**
 * Process start-of-turn status effects (Paralysis skip check, etc.)
 * @param {Object} combatant - The combatant
 * @returns {{ skipTurn: boolean, reason: string|null, statusChanges: Object[] }}
 */
function processStartOfTurnStatus(combatant) {
  const statusChanges = [];
  let skipTurn = false;
  let reason = null;

  if (!combatant.status_effects || combatant.status_effects.length === 0) {
    return { skipTurn, reason, statusChanges };
  }

  for (const effect of combatant.status_effects) {
    const definition = STATUS_DEFINITIONS[effect.status_type];

    // Paralysis check: d4, 1 = skip turn
    if (effect.status_type === StatusType.PARALYZED && definition.startOfTurnCheck) {
      const paraCheck = rollDice('1d4');
      if (paraCheck === 1) {
        skipTurn = true;
        reason = 'paralyzed';
      }
    }

    // Sleep: already incapacitated
    if (effect.status_type === StatusType.ASLEEP) {
      skipTurn = true;
      reason = 'asleep';
    }

    // Frozen: incapacitated
    if (effect.status_type === StatusType.FROZEN) {
      skipTurn = true;
      reason = 'frozen';
    }
  }

  return { skipTurn, reason, statusChanges };
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
  hasStatus
};
