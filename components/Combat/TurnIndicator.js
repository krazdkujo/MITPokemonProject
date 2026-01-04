/**
 * TurnIndicator Component
 * Shows the initiative order with current turn highlighted
 *
 * Feature: 015-combat-arena
 */

import styles from './TurnIndicator.module.css';

/**
 * TurnIndicator - Horizontal display of turn order
 *
 * @param {Object} props
 * @param {Array} props.combatants - All combatants in initiative order
 * @param {string} props.currentTurnId - Current turn's combatant_id
 * @param {number} props.roundNumber - Current round number
 */
export default function TurnIndicator({
  combatants = [],
  currentTurnId = null,
  roundNumber = 1
}) {
  if (!combatants || combatants.length === 0) {
    return null;
  }

  return (
    <div className={styles.turnIndicator}>
      <div className={styles.header}>
        <span className={styles.roundLabel}>Round {roundNumber}</span>
        <span className={styles.turnLabel}>Turn Order</span>
      </div>
      <div className={styles.combatantList}>
        {combatants.map((combatant, index) => {
          const isCurrent = combatant.combatant_id === currentTurnId;
          const isFainted = combatant.current_hp <= 0;
          const isPlayer = combatant.owner === 'player';

          return (
            <div
              key={combatant.combatant_id}
              className={`
                ${styles.combatantItem}
                ${isCurrent ? styles.current : ''}
                ${isFainted ? styles.fainted : ''}
                ${isPlayer ? styles.player : styles.opponent}
              `}
              title={`${combatant.name} (${combatant.current_hp}/${combatant.max_hp} HP)`}
            >
              <div className={styles.portrait}>
                <img
                  src={`/images/pokemon/${combatant.number}.png`}
                  alt={combatant.name}
                  className={styles.sprite}
                  onError={(e) => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = 'true';
                      e.target.style.display = 'none';
                    }
                  }}
                />
                {isCurrent && <div className={styles.currentMarker} />}
              </div>
              <span className={styles.name}>{combatant.name}</span>
              {isFainted && <span className={styles.faintedBadge}>KO</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
