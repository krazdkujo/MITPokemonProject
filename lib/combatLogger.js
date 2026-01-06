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
export function createLogger(options = {}) {
  const { colorize = true, timestamps = false, verbose = true } = options;

  const c = (color, text) => colorize ? `${COLORS[color]}${text}${COLORS.reset}` : text;
  const bold = (text) => c('bold', text);
  const dim = (text) => c('dim', text);

  return {
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
      return `  ${c('magenta', '★')} ${pokemonName.toUpperCase()} takes ${damage} ${statusType} damage (${hpBefore}→${hpAfter})`;
    }
  };
}

export default { createLogger };
