/**
 * MoveSelector Component
 * Displays available moves for the selected Pokemon
 *
 * Feature: 015-combat-arena
 */

import styles from './MoveSelector.module.css';

// Type colors for move badges
const TYPE_COLORS = {
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

/**
 * MoveSelector - List of moves for the current Pokemon
 *
 * @param {Object} props
 * @param {Array} props.moves - Array of move objects with id, name, type, power, pp info
 * @param {Object} props.movePp - Map of move_id to remaining PP
 * @param {string} props.selectedMoveId - Currently selected move ID
 * @param {Function} props.onMoveSelect - Handler when a move is selected
 * @param {boolean} props.disabled - Whether selection is disabled
 */
export default function MoveSelector({
  moves = [],
  movePp = {},
  selectedMoveId = null,
  onMoveSelect,
  disabled = false
}) {
  const handleMoveClick = (move) => {
    if (disabled) return;

    const remainingPp = movePp[move.id] ?? move.pp ?? 0;
    if (remainingPp <= 0) return;

    if (onMoveSelect) {
      onMoveSelect(move);
    }
  };

  const handleKeyDown = (e, move) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleMoveClick(move);
    }
  };

  if (!moves || moves.length === 0) {
    return (
      <div className={styles.moveSelector}>
        <p className={styles.noMoves}>No moves available</p>
      </div>
    );
  }

  return (
    <div className={styles.moveSelector}>
      <h4 className={styles.title}>Moves</h4>
      <div className={styles.moveList}>
        {moves.map((move) => {
          const remainingPp = movePp[move.id] ?? move.pp ?? 0;
          const maxPp = move.pp || move.max_pp || remainingPp;
          const noPp = remainingPp <= 0;
          const isSelected = selectedMoveId === move.id;
          const typeColor = TYPE_COLORS[move.type?.toLowerCase()] || TYPE_COLORS.normal;

          return (
            <div
              key={move.id}
              className={`${styles.moveItem} ${isSelected ? styles.selected : ''} ${noPp ? styles.noPp : ''} ${disabled ? styles.disabled : ''}`}
              onClick={() => handleMoveClick(move)}
              onKeyDown={(e) => handleKeyDown(e, move)}
              role="button"
              tabIndex={disabled || noPp ? -1 : 0}
              aria-label={`${move.name}, ${move.type} type, power ${move.power || '-'}, PP ${remainingPp}/${maxPp}`}
              aria-disabled={disabled || noPp}
            >
              <div className={styles.moveHeader}>
                <span className={styles.moveName}>{move.name}</span>
                <span
                  className={styles.moveType}
                  style={{ backgroundColor: typeColor }}
                >
                  {move.type}
                </span>
              </div>
              <div className={styles.moveStats}>
                <span className={styles.movePower}>
                  PWR: {move.power || '-'}
                </span>
                <span className={`${styles.movePp} ${remainingPp <= 2 ? styles.lowPp : ''}`}>
                  PP: {remainingPp}/{maxPp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
