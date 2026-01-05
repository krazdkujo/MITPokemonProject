/**
 * PokemonTooltip Component
 * Displays detailed Pokemon stats on hover during combat
 *
 * Feature: 018-combat-enhancements
 */

import React from 'react';
import styles from './PokemonTooltip.module.css';

/**
 * Calculate attribute modifier from attribute score
 * @param {number} score - Attribute score (typically 1-20)
 * @returns {number} Modifier value
 */
function getAttributeModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Format modifier for display (+X or -X)
 * @param {number} modifier - The modifier value
 * @returns {string} Formatted string like "+2" or "-1"
 */
function formatModifier(modifier) {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Get proficiency bonus based on level
 * @param {number} level - Pokemon level
 * @returns {number} Proficiency bonus
 */
function getProficiencyBonus(level) {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

/**
 * Get type color for display
 * @param {string} type - Pokemon type
 * @returns {string} CSS color value
 */
function getTypeColor(type) {
  const colors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
  };
  return colors[type?.toLowerCase()] || '#888';
}

/**
 * PokemonTooltip Component
 *
 * @param {Object} props
 * @param {Object} props.combatant - Combatant data to display
 * @param {{ col: number, row: number }} props.position - Grid position for positioning
 * @param {boolean} props.visible - Whether tooltip is visible
 * @param {number} props.gridWidth - Width of the grid (for positioning logic)
 */
export default function PokemonTooltip({ combatant, position, visible, gridWidth = 10 }) {
  if (!visible || !combatant) {
    return null;
  }

  const {
    name,
    level,
    current_hp,
    max_hp,
    type = [],
    attributes = {},
    ac,
    known_moves = [],
    move_pp = {},
    status_effects = []
  } = combatant;

  const proficiency = getProficiencyBonus(level);

  // Position tooltip on left or right based on grid position
  const isRightHalf = position?.col >= gridWidth / 2;
  const tooltipClass = isRightHalf ? styles.tooltipLeft : styles.tooltipRight;

  // Calculate HP bar percentage
  const hpPercent = max_hp > 0 ? (current_hp / max_hp) * 100 : 0;
  const hpBarColor = hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336';

  return (
    <div className={`${styles.tooltip} ${tooltipClass}`} role="tooltip" aria-label={`${name} stats`}>
      {/* Header: Name and Level */}
      <div className={styles.header}>
        <span className={styles.name}>{name}</span>
        <span className={styles.level}>Lv. {level}</span>
      </div>

      {/* HP Bar */}
      <div className={styles.hpSection}>
        <div className={styles.hpLabel}>
          HP: {current_hp}/{max_hp}
        </div>
        <div className={styles.hpBarContainer}>
          <div
            className={styles.hpBar}
            style={{ width: `${hpPercent}%`, backgroundColor: hpBarColor }}
          />
        </div>
      </div>

      {/* Types */}
      <div className={styles.typeSection}>
        {type.map((t, idx) => (
          <span
            key={idx}
            className={styles.typeBadge}
            style={{ backgroundColor: getTypeColor(t) }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* AC */}
      <div className={styles.acSection}>
        AC: {ac || 10}
      </div>

      {/* Attributes */}
      <div className={styles.attributes}>
        <div className={styles.attrRow}>
          <span className={styles.attr}>
            STR: {attributes.str || 10} ({formatModifier(getAttributeModifier(attributes.str || 10))})
          </span>
          <span className={styles.attr}>
            INT: {attributes.int || 10} ({formatModifier(getAttributeModifier(attributes.int || 10))})
          </span>
        </div>
        <div className={styles.attrRow}>
          <span className={styles.attr}>
            DEX: {attributes.dex || 10} ({formatModifier(getAttributeModifier(attributes.dex || 10))})
          </span>
          <span className={styles.attr}>
            WIS: {attributes.wis || 10} ({formatModifier(getAttributeModifier(attributes.wis || 10))})
          </span>
        </div>
        <div className={styles.attrRow}>
          <span className={styles.attr}>
            CON: {attributes.con || 10} ({formatModifier(getAttributeModifier(attributes.con || 10))})
          </span>
          <span className={styles.attr}>
            CHA: {attributes.cha || 10} ({formatModifier(getAttributeModifier(attributes.cha || 10))})
          </span>
        </div>
      </div>

      {/* Proficiency */}
      <div className={styles.proficiency}>
        Proficiency: +{proficiency}
      </div>

      {/* Moves */}
      <div className={styles.movesSection}>
        <div className={styles.movesHeader}>Moves:</div>
        {known_moves.length > 0 ? (
          known_moves.map((move, idx) => {
            const currentPp = move_pp[move.id] ?? move.pp ?? 0;
            const maxPp = move.pp ?? 0;
            const isLowPp = currentPp <= 2 && currentPp > 0;
            const isNoPp = currentPp <= 0;

            return (
              <div
                key={idx}
                className={`${styles.moveRow} ${isNoPp ? styles.noPp : ''} ${isLowPp ? styles.lowPp : ''}`}
              >
                <span
                  className={styles.moveType}
                  style={{ backgroundColor: getTypeColor(move.type) }}
                />
                <span className={styles.moveName}>{move.name}</span>
                <span className={styles.movePp}>[{currentPp}/{maxPp} PP]</span>
              </div>
            );
          })
        ) : (
          <div className={styles.noMoves}>No moves</div>
        )}
      </div>

      {/* Status Effects */}
      <div className={styles.statusSection}>
        <span className={styles.statusLabel}>Status: </span>
        {status_effects.length > 0 ? (
          status_effects.map((effect, idx) => (
            <span key={idx} className={styles.statusBadge}>
              {effect.status_type || effect.type}
              {effect.duration ? ` (${effect.duration})` : ''}
            </span>
          ))
        ) : (
          <span className={styles.noStatus}>None</span>
        )}
      </div>
    </div>
  );
}
