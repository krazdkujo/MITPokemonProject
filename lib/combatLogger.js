/**
 * Combat Logger
 * Verbose logging formatter for combat test harness
 *
 * Feature: 021-combat-test-harness
 */

// ANSI color codes for CLI output
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Create a logger instance for formatting combat events
 *
 * @param {Object} options - Logger options
 * @param {boolean} options.colorize - Use ANSI colors (CLI only), default: true
 * @param {boolean} options.timestamps - Include timestamps, default: false
 * @param {boolean} options.verbose - Include all calculation details, default: true
 * @returns {Object} Logger instance
 */
/**
 * Log entry types for structured logging
 * @type {Object}
 */
export const LogEntryType = {
  ATTACK: 'attack',
  DAMAGE: 'damage',
  STATUS_APPLIED: 'status_applied',
  STATUS_BLOCKED: 'status_blocked',
  STATUS_DAMAGE: 'status_damage',
  STATUS_CHECK: 'status_check',
  STATUS_REMOVED: 'status_removed',
  HEALING: 'healing',
  RECOIL: 'recoil',
  AC_CHANGE: 'ac_change',
  SPEED_CHANGE: 'speed_change',
  STAT_CHANGE: 'stat_change',
  TURN_SKIP: 'turn_skip',
  CONCENTRATION_BROKEN: 'concentration_broken',
  BURNED_PENALTY: 'burned_penalty',
  FLINCHED_EFFECT: 'flinched_effect'
};

export function createLogger(options = {}) {
  const { colorize = true, timestamps = false, verbose = true } = options;

  const c = (color, text) => colorize ? `${COLORS[color]}${text}${COLORS.reset}` : text;
  const bold = (text) => c('bold', text);
  const dim = (text) => c('dim', text);

  // Structured log array for programmatic access
  const structuredLog = [];
  let currentTurn = 0;

  /**
   * Add entry to structured log
   * @param {string} type - Entry type from LogEntryType
   * @param {Object} details - Type-specific details
   */
  const addStructuredEntry = (type, details) => {
    structuredLog.push({
      type,
      turn: currentTurn,
      timestamp: Date.now(),
      details
    });
  };

  return {
    /**
     * Get all structured log entries
     * @returns {Array} Array of CombatLogEntry objects
     */
    getStructuredLog() {
      return [...structuredLog];
    },

    /**
     * Clear the structured log
     */
    clearStructuredLog() {
      structuredLog.length = 0;
      currentTurn = 0;
    },

    /**
     * Set current turn number for log entries
     * @param {number} turn - Turn number
     */
    setCurrentTurn(turn) {
      currentTurn = turn;
    },
    /**
     * Log turn start header
     * @param {number} turnNumber - Current turn number
     * @returns {string} Formatted turn header
     */
    logTurnStart(turnNumber) {
      const line = '═'.repeat(67);
      return `\n${c('cyan', line)}\n${c('cyan', bold(`TURN ${turnNumber}`))}\n${c('cyan', line)}\n`;
    },

    /**
     * Log an attack action
     * @param {string} attacker - Attacker name
     * @param {string} move - Move name
     * @param {string} target - Target name
     * @param {Object} attackRoll - Attack roll details
     * @param {boolean} isPlayer - Whether attacker is player's Pokemon
     * @returns {string} Formatted attack log
     */
    logAttack(attacker, move, target, attackRoll, isPlayer = true) {
      const arrow = isPlayer ? '▶' : '◀';
      const color = isPlayer ? 'green' : 'red';

      let lines = [];
      lines.push(`${c(color, arrow)} ${bold(attacker.toUpperCase())} uses ${c('yellow', move.toUpperCase())}`);
      lines.push(`  Target: ${target.toUpperCase()}`);

      if (verbose && attackRoll) {
        const { natural, modifier, total, crit_threshold, is_crit, is_miss, rolls, had_advantage, had_disadvantage } = attackRoll;

        let rollStr = `d20(${natural})`;
        if (had_advantage) rollStr = `d20(${rolls.join(',')}→${natural}) ADV`;
        if (had_disadvantage) rollStr = `d20(${rolls.join(',')}→${natural}) DIS`;

        const modStr = modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;

        let resultStr = '';
        if (is_miss) {
          resultStr = c('red', 'MISS (NAT 1)');
        } else if (is_crit) {
          resultStr = c('magenta', `CRIT! (NAT ${natural})`);
        }

        lines.push(`  ├─ Attack Roll: ${rollStr} ${modStr} = ${total}${resultStr ? ' → ' + resultStr : ''}`);
      }

      return lines.join('\n');
    },

    /**
     * Log hit/miss result vs AC
     * @param {number} total - Attack roll total
     * @param {number} targetAc - Target's AC
     * @param {boolean} hit - Whether attack hit
     * @param {boolean} isCrit - Whether it was a critical hit
     * @returns {string} Formatted hit/miss line
     */
    logHitCheck(total, targetAc, hit, isCrit = false) {
      const result = hit
        ? (isCrit ? c('magenta', 'CRIT!') : c('green', 'HIT'))
        : c('red', 'MISS');
      return `  ├─ vs AC ${targetAc} → ${result}`;
    },

    /**
     * Log damage calculation
     * @param {Object} damage - Damage calculation details
     * @param {number} hpBefore - HP before damage
     * @param {number} hpAfter - HP after damage
     * @param {string} targetName - Target's name
     * @returns {string} Formatted damage log
     */
    logDamage(damage, hpBefore, hpAfter, targetName) {
      if (!damage || !damage.dice_expression) {
        return `  └─ Result: No damage`;
      }

      let lines = [];

      if (verbose) {
        const { dice_expression, base_dice_total, power_modifier, stab_bonus, type_multiplier, type_effectiveness, final_damage, is_critical } = damage;

        let damageStr = `${dice_expression}`;
        if (damage.dice_rolls) {
          damageStr = `${dice_expression}(${damage.dice_rolls.join(',')})`;
        }

        let modifiers = [];
        if (power_modifier) modifiers.push(`${power_modifier >= 0 ? '+' : ''}${power_modifier} (power)`);
        if (stab_bonus) modifiers.push(`+${stab_bonus} (STAB)`);
        if (is_critical) modifiers.push(c('magenta', 'x2 (CRIT)'));

        const modStr = modifiers.length > 0 ? ' ' + modifiers.join(' ') : '';

        lines.push(`  ├─ Damage: ${damageStr}${modStr} = ${base_dice_total || final_damage}`);

        // Type effectiveness
        let typeStr = '';
        if (type_multiplier === 0) typeStr = c('dim', 'IMMUNE');
        else if (type_multiplier === 0.25) typeStr = c('red', '0.25x (doubly resisted)');
        else if (type_multiplier === 0.5) typeStr = c('yellow', '0.5x (not very effective)');
        else if (type_multiplier === 2) typeStr = c('green', '2x (super effective)');
        else if (type_multiplier === 4) typeStr = c('cyan', '4x (doubly effective)');
        else typeStr = '1x (normal)';

        if (type_effectiveness) {
          lines.push(`  ├─ Type: ${type_effectiveness} → ${typeStr}`);
        }

        const hpColor = hpAfter <= 0 ? 'red' : 'white';
        lines.push(`  └─ Result: ${c('yellow', final_damage + ' damage')} → ${targetName.toUpperCase()} HP: ${hpBefore}→${c(hpColor, hpAfter)}`);
      } else {
        lines.push(`  └─ Result: ${damage.final_damage} damage → ${targetName.toUpperCase()} HP: ${hpBefore}→${hpAfter}`);
      }

      return lines.join('\n');
    },

    /**
     * Log a miss
     * @param {string} attacker - Attacker name
     * @param {string} move - Move name
     * @param {string} target - Target name
     * @param {Object} attackRoll - Attack roll details
     * @returns {string} Formatted miss log
     */
    logMiss(attacker, move, target, attackRoll) {
      return `  └─ Result: ${c('dim', 'No damage (missed)')}`;
    },

    /**
     * Log saving throw move
     * @param {Object} saveResult - Save move result
     * @param {string} targetName - Target name
     * @returns {string} Formatted save log
     */
    logSaveMove(saveResult, targetName) {
      if (!saveResult) return '';

      const { saveType, dc, saveRoll, saveMod, saveTotal, saved } = saveResult;
      const modStr = saveMod >= 0 ? `+ ${saveMod}` : `- ${Math.abs(saveMod)}`;
      const result = saved ? c('green', 'SAVED') : c('red', 'FAILED');

      return `  ├─ ${saveType} Save: d20(${saveRoll}) ${modStr} = ${saveTotal} vs DC ${dc} → ${result}`;
    },

    /**
     * Log status effect
     * @param {string} target - Target name
     * @param {string} statusType - Status type (BURNED, POISONED, etc.)
     * @param {boolean} applied - Whether status was applied
     * @param {string} reason - Reason if blocked
     * @returns {string} Formatted status log
     */
    logStatus(target, statusType, applied, reason = null) {
      if (applied) {
        return `  ${c('magenta', '★')} ${target.toUpperCase()} is now ${c('magenta', statusType)}!`;
      } else if (reason) {
        return `  ${c('dim', '○')} ${statusType} blocked: ${reason}`;
      }
      return '';
    },

    /**
     * Log turn end with HP summary
     * @param {Object} pokemon1 - First Pokemon with name, current_hp, max_hp
     * @param {Object} pokemon2 - Second Pokemon with name, current_hp, max_hp
     * @returns {string} Formatted turn end summary
     */
    logTurnEnd(pokemon1, pokemon2) {
      const line = '─'.repeat(67);
      const hp1 = `${pokemon1.name}: ${pokemon1.current_hp}/${pokemon1.max_hp}`;
      const hp2 = `${pokemon2.name}: ${pokemon2.current_hp}/${pokemon2.max_hp}`;
      return `\n${c('dim', line)}\nHP: ${hp1} | ${hp2}\n${c('dim', line)}`;
    },

    /**
     * Log battle end
     * @param {string} winner - Winner name
     * @param {number} totalTurns - Total turns played
     * @param {Object} summary - Battle summary with stats
     * @returns {string} Formatted battle end
     */
    logBattleEnd(winner, totalTurns, summary = null) {
      const line = '═'.repeat(67);
      let lines = [];

      lines.push(`\n${c('cyan', line)}`);
      lines.push(c('cyan', bold('BATTLE COMPLETE')));
      lines.push(c('cyan', line));

      if (winner === 'draw') {
        lines.push(`Result: ${c('yellow', 'DRAW')}`);
      } else {
        lines.push(`Winner: ${c('green', bold(winner.toUpperCase()))}`);
      }
      lines.push(`Total Turns: ${totalTurns}`);

      if (summary) {
        lines.push(`Duration: ${summary.durationMs}ms`);
        if (summary.seed) {
          lines.push(`Seed: ${summary.seed} ${c('dim', `(use --seed ${summary.seed} to reproduce)`)}`);
        }

        if (summary.combatant1Summary && summary.combatant2Summary) {
          lines.push('');
          const s1 = summary.combatant1Summary;
          const s2 = summary.combatant2Summary;
          lines.push(`${s1.name}: ${s1.finalHp}/${s1.maxHp} HP | Dealt ${s1.totalDamageDealt} damage | ${s1.attacksHit}/${s1.attacksMade} attacks hit | ${s1.criticalHits} crits`);
          lines.push(`${s2.name}: ${s2.finalHp}/${s2.maxHp} HP | Dealt ${s2.totalDamageDealt} damage | ${s2.attacksHit}/${s2.attacksMade} attacks hit | ${s2.criticalHits} crits`);
        }
      }

      lines.push(c('cyan', line));

      return lines.join('\n');
    },

    /**
     * Log battle header
     * @param {Object} pokemon1 - First Pokemon
     * @param {Object} pokemon2 - Second Pokemon
     * @param {number} seed - RNG seed used
     * @returns {string} Formatted battle header
     */
    logBattleHeader(pokemon1, pokemon2, seed) {
      const line = '═'.repeat(67);
      let lines = [];

      lines.push(c('cyan', line));
      lines.push(c('cyan', bold('COMBAT SIMULATION')));
      lines.push(c('cyan', line));
      lines.push(`Seed: ${seed}`);
      lines.push(`Pokemon 1: ${pokemon1.name} (Level ${pokemon1.level}) - HP: ${pokemon1.current_hp}/${pokemon1.max_hp}`);
      lines.push(`Pokemon 2: ${pokemon2.name} (Level ${pokemon2.level}) - HP: ${pokemon2.current_hp}/${pokemon2.max_hp}`);
      lines.push(c('cyan', line));

      return lines.join('\n');
    },

    /**
     * Log skipped turn due to status
     * @param {string} pokemonName - Pokemon name
     * @param {string} reason - Why turn was skipped
     * @returns {string} Formatted skip message
     */
    logSkippedTurn(pokemonName, reason) {
      return `  ${c('yellow', '⚠')} ${pokemonName.toUpperCase()} ${c('yellow', reason)}`;
    },

    /**
     * Log end-of-turn status damage
     * @param {string} pokemonName - Pokemon name
     * @param {string} statusType - Status causing damage
     * @param {number} damage - Damage dealt
     * @param {number} hpBefore - HP before
     * @param {number} hpAfter - HP after
     * @returns {string} Formatted status damage
     */
    logStatusDamage(pokemonName, statusType, damage, hpBefore, hpAfter) {
      addStructuredEntry(LogEntryType.STATUS_DAMAGE, {
        pokemon: pokemonName,
        statusType,
        damage,
        hpBefore,
        hpAfter,
        fainted: hpAfter <= 0
      });
      return `  ${c('magenta', '★')} ${pokemonName.toUpperCase()} takes ${damage} ${statusType} damage (${hpBefore}→${hpAfter})`;
    },

    /**
     * T011: Log successful status effect application
     * @param {string} target - Pokemon name receiving status
     * @param {string} statusType - Status type (BURNED, PARALYZED, etc.)
     * @param {string} source - Move name that applied status
     * @param {Object} trigger - Trigger details { type, roll, threshold, dc, saveTotal }
     * @returns {string} Formatted log line
     */
    logStatusApplied(target, statusType, source, trigger = {}) {
      addStructuredEntry(LogEntryType.STATUS_APPLIED, {
        target,
        statusType,
        source,
        trigger
      });

      let lines = [];
      lines.push(`  ${c('magenta', '★')} ${target.toUpperCase()} is now ${c('magenta', statusType)}!`);

      // Add trigger details if available
      if (trigger && trigger.type) {
        let triggerStr = '';
        if (trigger.type === 'save' && trigger.dc !== undefined) {
          const saveResult = trigger.saveTotal < trigger.dc ? 'FAILED' : 'SAVED';
          triggerStr = `${source} (${trigger.saveType || 'CON'} save: ${trigger.saveTotal} vs DC ${trigger.dc} - ${saveResult})`;
        } else if (trigger.type === 'natural_roll' && trigger.roll !== undefined) {
          triggerStr = `${source} (rolled ${trigger.roll}${trigger.threshold ? ` ≥ ${trigger.threshold}` : ''})`;
        } else if (trigger.type === 'on_hit') {
          triggerStr = `${source} (on hit)`;
        } else if (trigger.type === 'fail_by_5') {
          triggerStr = `${source} (failed save by 5+)`;
        } else {
          triggerStr = source;
        }
        lines.push(`    └─ ${triggerStr}`);
      }

      return lines.join('\n');
    },

    /**
     * T018: Log fainting from status damage
     * @param {string} pokemonName - Pokemon name
     * @param {string} statusType - Status that caused the faint
     * @param {number} damage - Final damage dealt
     * @param {number} hpBefore - HP before damage
     * @returns {string} Formatted log line
     */
    logStatusFaint(pokemonName, statusType, damage, hpBefore) {
      addStructuredEntry(LogEntryType.STATUS_DAMAGE, {
        pokemon: pokemonName,
        statusType,
        damage,
        hpBefore,
        hpAfter: 0,
        fainted: true
      });
      return `  ${c('red', '☠')} ${pokemonName.toUpperCase()} fainted from ${statusType} damage! (${hpBefore}→0)`;
    },

    /**
     * T022: Log status check at start of turn
     * @param {string} target - Pokemon name
     * @param {string} checkType - Check type (paralysis, wake, frozen_break, confusion)
     * @param {number} roll - Dice roll result
     * @param {number} threshold - Value needed to pass
     * @param {boolean} passed - Whether check passed
     * @param {Object} details - Additional details { rolls, dc, modifier, diceExpr, result }
     * @returns {string} Formatted log line
     */
    logStatusCheck(target, checkType, roll, threshold, passed, details = {}) {
      addStructuredEntry(LogEntryType.STATUS_CHECK, {
        target,
        checkType,
        roll,
        threshold,
        passed,
        details
      });

      const symbols = {
        paralysis: '⚡',
        wake: '💤',
        frozen_break: '❄️',
        confusion: '💫'
      };
      const symbol = symbols[checkType] || '●';

      let resultStr = '';
      switch (checkType) {
        case 'paralysis':
          resultStr = passed ? 'Can act!' : 'Cannot move!';
          return `  ${c('yellow', symbol)} ${target.toUpperCase()} paralysis check: d4(${roll}) → ${c(passed ? 'green' : 'red', resultStr)}`;

        case 'wake':
          if (details.diceExpr) {
            resultStr = passed ? 'Woke up!' : 'Still asleep';
            return `  ${c('blue', symbol)} ${target.toUpperCase()} wake check: d20(${roll}) ≥ ${threshold} → ${c(passed ? 'green' : 'yellow', resultStr)}`;
          }
          resultStr = passed ? 'Woke up!' : 'Still asleep';
          return `  ${c('blue', symbol)} ${target.toUpperCase()} wake check: d20(${roll}) ≥ ${threshold} → ${c(passed ? 'green' : 'yellow', resultStr)}`;

        case 'frozen_break':
          if (details.modifier !== undefined) {
            const modStr = details.modifier >= 0 ? `+ ${details.modifier}` : `- ${Math.abs(details.modifier)}`;
            const total = roll + (details.modifier || 0);
            resultStr = passed ? 'Broke free!' : 'Still frozen';
            return `  ${c('cyan', symbol)} ${target.toUpperCase()} freeze break: STR save d20(${roll}) ${modStr} = ${total} vs DC ${threshold} → ${c(passed ? 'green' : 'cyan', resultStr)}`;
          }
          resultStr = passed ? 'Broke free!' : 'Still frozen';
          return `  ${c('cyan', symbol)} ${target.toUpperCase()} freeze break: d20(${roll}) vs DC ${threshold} → ${c(passed ? 'green' : 'cyan', resultStr)}`;

        case 'confusion':
          return `  ${c('magenta', symbol)} ${target.toUpperCase()} confusion: d8(${roll}) → ${c('magenta', details.result || 'Acts confused')}`;

        default:
          return `  ${symbol} ${target.toUpperCase()} ${checkType} check: ${roll} vs ${threshold} → ${passed ? 'PASS' : 'FAIL'}`;
      }
    },

    /**
     * T023: Enhanced skipped turn with roll details
     * @param {string} pokemonName - Pokemon name
     * @param {string} reason - Why turn was skipped
     * @param {Object} rollDetails - Optional { roll, diceExpr, threshold }
     * @returns {string} Formatted skip message
     */
    logSkippedTurnWithRoll(pokemonName, reason, rollDetails = null) {
      addStructuredEntry(LogEntryType.TURN_SKIP, {
        pokemon: pokemonName,
        reason,
        rollDetails
      });

      if (rollDetails && rollDetails.roll !== undefined) {
        const rollStr = rollDetails.diceExpr ? `${rollDetails.diceExpr}(${rollDetails.roll})` : `rolled ${rollDetails.roll}`;
        return `  ${c('yellow', '⚠')} ${pokemonName.toUpperCase()} ${c('yellow', reason)} (${rollStr})`;
      }
      return `  ${c('yellow', '⚠')} ${pokemonName.toUpperCase()} ${c('yellow', reason)}`;
    },

    /**
     * T028: Log healing effect
     * @param {string} target - Pokemon name healed
     * @param {string} source - Move name
     * @param {string} healType - Type (drain, dice, fixed)
     * @param {number} amount - HP restored
     * @param {Object} details - { hpBefore, hpAfter, damageDealt, percentage, diceExpr, diceRoll }
     * @returns {string} Formatted log line
     */
    logHealing(target, source, healType, amount, details = {}) {
      addStructuredEntry(LogEntryType.HEALING, {
        target,
        source,
        healType,
        amount,
        details
      });

      let lines = [];
      const symbol = '💚';

      if (healType === 'drain' && details.damageDealt) {
        lines.push(`  ${c('green', symbol)} ${target.toUpperCase()} healed ${amount} HP from ${source.toUpperCase()} (${details.percentage || 50}% of ${details.damageDealt} damage)`);
      } else if (healType === 'dice' && details.diceExpr) {
        const rollStr = details.diceRoll ? `(${details.diceRoll})` : '';
        lines.push(`  ${c('green', symbol)} ${target.toUpperCase()} healed ${amount} HP from ${source.toUpperCase()} (${details.diceExpr}${rollStr} = ${amount})`);
      } else {
        lines.push(`  ${c('green', symbol)} ${target.toUpperCase()} healed ${amount} HP from ${source.toUpperCase()}`);
      }

      if (details.hpBefore !== undefined && details.hpAfter !== undefined) {
        lines.push(`    └─ HP: ${details.hpBefore} → ${details.hpAfter}`);
      }

      return lines.join('\n');
    },

    /**
     * T029: Log recoil damage
     * @param {string} target - Pokemon name taking recoil
     * @param {string} move - Move name
     * @param {number} amount - Recoil damage taken
     * @param {Object} details - { hpBefore, hpAfter, damageDealt, percentage }
     * @returns {string} Formatted log line
     */
    logRecoil(target, move, amount, details = {}) {
      addStructuredEntry(LogEntryType.RECOIL, {
        target,
        move,
        amount,
        details
      });

      let lines = [];
      const symbol = '💥';

      if (details.damageDealt && details.percentage) {
        lines.push(`  ${c('yellow', symbol)} ${target.toUpperCase()} takes ${amount} recoil from ${move.toUpperCase()} (${details.percentage}% of ${details.damageDealt} damage)`);
      } else {
        lines.push(`  ${c('yellow', symbol)} ${target.toUpperCase()} takes ${amount} recoil from ${move.toUpperCase()}`);
      }

      if (details.hpBefore !== undefined && details.hpAfter !== undefined) {
        lines.push(`    └─ HP: ${details.hpBefore} → ${details.hpAfter}`);
      }

      return lines.join('\n');
    },

    /**
     * T030: Log AC modification
     * @param {string} target - Pokemon name
     * @param {string} source - Move/effect name
     * @param {number} amount - AC change amount
     * @param {string} direction - 'increase' or 'decrease'
     * @param {Object} details - { newAC, stackCount, maxStack }
     * @returns {string} Formatted log line
     */
    logACChange(target, source, amount, direction, details = {}) {
      addStructuredEntry(LogEntryType.AC_CHANGE, {
        target,
        source,
        amount,
        direction,
        details
      });

      const symbol = direction === 'increase' ? '🛡️' : '🔻';
      const color = direction === 'increase' ? 'cyan' : 'yellow';
      const dirStr = direction === 'increase' ? 'increased' : 'reduced';

      let acStr = details.newAC !== undefined ? ` (now AC ${details.newAC}` : '';
      if (details.stackCount && details.maxStack) {
        acStr += `, stack ${details.stackCount}/${details.maxStack}`;
      }
      if (acStr) acStr += ')';

      return `  ${c(color, symbol)} ${target.toUpperCase()} AC ${dirStr} by ${amount} from ${source.toUpperCase()}${acStr}`;
    },

    /**
     * T037: Log burn damage penalty application
     * @param {string} attacker - Pokemon name
     * @param {number} roll1 - First damage roll
     * @param {number} roll2 - Second damage roll
     * @param {number} used - Roll that was used (lower one)
     * @param {string} diceExpr - Dice expression
     * @returns {string} Formatted log line
     */
    logBurnedPenalty(attacker, roll1, roll2, used, diceExpr = '') {
      addStructuredEntry(LogEntryType.BURNED_PENALTY, {
        attacker,
        roll1,
        roll2,
        used,
        diceExpr
      });

      return `  ${c('red', '🔥')} BURNED penalty: ${diceExpr}(${roll1},${roll2}) → using ${used} (lower roll)`;
    },

    /**
     * T041: Log flinch disadvantage/advantage application
     * @param {string} pokemon - Pokemon name
     * @param {string} effectType - 'attack_disadvantage' or 'target_advantage'
     * @param {Object} details - { rolls, used }
     * @returns {string} Formatted log line
     */
    logFlinchedEffect(pokemon, effectType, details = {}) {
      addStructuredEntry(LogEntryType.FLINCHED_EFFECT, {
        pokemon,
        effectType,
        details
      });

      if (effectType === 'attack_disadvantage') {
        const rollsStr = details.rolls ? `d20(${details.rolls.join(',')})` : 'd20';
        return `  ${c('yellow', '😵')} FLINCHED: ${pokemon.toUpperCase()} attacks with disadvantage ${rollsStr} → ${details.used}`;
      } else if (effectType === 'target_advantage') {
        return `  ${c('yellow', '😵')} FLINCHED: Target has advantage on saves vs ${pokemon.toUpperCase()}`;
      }
      return `  ${c('yellow', '😵')} ${pokemon.toUpperCase()} is FLINCHED`;
    },

    /**
     * T012: Log blocked status application
     * @param {string} target - Pokemon name
     * @param {string} statusType - Status type that was blocked
     * @param {string} reason - Reason code (type_immunity, already_has_status, grace_period, saved)
     * @param {Object} details - Additional details { saveTotal, dc, immunityType }
     * @returns {string} Formatted log line
     */
    logStatusBlocked(target, statusType, reason, details = {}) {
      addStructuredEntry(LogEntryType.STATUS_BLOCKED, {
        target,
        statusType,
        reason,
        details
      });

      // Format reason for display
      let reasonStr = '';
      switch (reason) {
        case 'type_immunity':
          reasonStr = details.immunityType
            ? `${details.immunityType}-type immunity`
            : 'Type immunity';
          break;
        case 'already_has_status':
          reasonStr = 'Already has status';
          break;
        case 'grace_period':
          reasonStr = 'Recently affected (grace period)';
          break;
        case 'saved':
          reasonStr = details.dc !== undefined
            ? `Save succeeded (${details.saveTotal} vs DC ${details.dc})`
            : 'Save succeeded';
          break;
        case 'roll_failed':
          reasonStr = details.roll !== undefined
            ? `Roll ${details.roll} < ${details.threshold} threshold`
            : 'Roll below threshold';
          break;
        default:
          reasonStr = reason || 'Unknown';
      }

      return `  ${c('dim', '○')} ${statusType} blocked on ${target.toUpperCase()}: ${reasonStr}`;
    }
  };
}

export default { createLogger };
