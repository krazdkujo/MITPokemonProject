/**
 * PokemonToken Component
 * Renders a Pokemon on the battle grid with sprite, HP bar, and status indicators
 *
 * Feature: 015-combat-arena
 */

import { useState, useEffect } from 'react';
import styles from './PokemonToken.module.css';
import PokemonTooltip from './PokemonTooltip';

/**
 * PokemonToken - Visual representation of a Pokemon on the grid
 *
 * @param {Object} props
 * @param {Object} props.combatant - Full combatant data for tooltip display
 * @param {string} props.combatantId - Unique combatant identifier
 * @param {number} props.pokemonId - Pokemon species ID for sprite
 * @param {string} props.name - Pokemon's display name
 * @param {number} props.currentHp - Current HP
 * @param {number} props.maxHp - Maximum HP
 * @param {string} props.owner - 'player' or 'opponent'
 * @param {boolean} props.isSelected - Whether this Pokemon is selected
 * @param {boolean} props.isCurrentTurn - Whether it's this Pokemon's turn
 * @param {boolean} props.isFainted - Whether the Pokemon has fainted
 * @param {Array} props.statusEffects - Array of status effect objects
 * @param {Object} props.damageAnimation - Damage number to animate { value, key }
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether interaction is disabled
 */
export default function PokemonToken({
  combatant = null,
  combatantId,
  pokemonId,
  name,
  currentHp,
  maxHp,
  owner = 'player',
  isSelected = false,
  isCurrentTurn = false,
  isFainted = false,
  statusEffects = [],
  damageAnimation = null,
  onClick,
  disabled = false
}) {
  const [showDamage, setShowDamage] = useState(false);
  const [damageValue, setDamageValue] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // Handle damage animation
  useEffect(() => {
    if (damageAnimation) {
      setDamageValue(damageAnimation.value);
      setShowDamage(true);

      const timer = setTimeout(() => {
        setShowDamage(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [damageAnimation?.key]);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(combatantId);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick(combatantId);
    }
  };

  // Calculate HP percentage for bar
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  // Determine HP bar color
  let hpColorClass = styles.hpHigh;
  if (hpPercent <= 25) {
    hpColorClass = styles.hpLow;
  } else if (hpPercent <= 50) {
    hpColorClass = styles.hpMedium;
  }

  // Build class names
  const classNames = [styles.pokemonToken];

  if (owner === 'opponent') {
    classNames.push(styles.opponent);
  }

  if (isSelected) {
    classNames.push(styles.selected);
  }

  if (isCurrentTurn) {
    classNames.push(styles.currentTurn);
  }

  if (isFainted) {
    classNames.push(styles.fainted);
  }

  if (onClick && !disabled) {
    classNames.push(styles.clickable);
  }

  // Get sprite path
  const spritePath = `/images/pokemon/${pokemonId}.png`;

  // Hover handlers for tooltip
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div
      className={classNames.join(' ')}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick && !disabled ? 0 : -1}
      aria-label={`${name}, ${currentHp}/${maxHp} HP${isFainted ? ', fainted' : ''}${isCurrentTurn ? ', current turn' : ''}`}
      data-combatant-id={combatantId}
    >
      {/* Pokemon Sprite */}
      <div className={styles.spriteContainer}>
        <img
          src={spritePath}
          alt={name}
          className={styles.sprite}
          onError={(e) => {
            // Prevent infinite loop by only setting fallback once
            if (!e.target.dataset.fallback) {
              e.target.dataset.fallback = 'true';
              e.target.style.display = 'none';
            }
          }}
        />
      </div>

      {/* HP Bar */}
      <div className={styles.hpBar}>
        <div
          className={`${styles.hpFill} ${hpColorClass}`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* Status Effect Icons (placeholder - full implementation in US4) */}
      {statusEffects.length > 0 && (
        <div className={styles.statusIcons}>
          {statusEffects.slice(0, 3).map((status, index) => (
            <span
              key={`${status.type || status}-${index}`}
              className={styles.statusIcon}
              title={status.type || status}
            >
              {getStatusAbbreviation(status.type || status)}
            </span>
          ))}
        </div>
      )}

      {/* Damage Animation */}
      {showDamage && damageValue !== null && (
        <div className={styles.damageNumber}>
          -{damageValue}
        </div>
      )}

      {/* Current Turn Indicator */}
      {isCurrentTurn && !isFainted && (
        <div className={styles.turnIndicator} />
      )}

      {/* Pokemon Stats Tooltip - Feature 018 */}
      {combatant && (
        <PokemonTooltip
          combatant={combatant}
          position={combatant.position}
          visible={isHovered}
          gridWidth={10}
        />
      )}
    </div>
  );
}

/**
 * Get abbreviated status effect name
 */
function getStatusAbbreviation(status) {
  const abbreviations = {
    poison: 'PSN',
    burn: 'BRN',
    paralysis: 'PAR',
    sleep: 'SLP',
    freeze: 'FRZ',
    confusion: 'CNF',
    toxic: 'TOX'
  };
  return abbreviations[status?.toLowerCase()] || status?.substring(0, 3).toUpperCase() || '???';
}
