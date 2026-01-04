/**
 * BattleGrid Component
 * Renders the 10x10 Combat Arena grid with labels and occupants
 *
 * Feature: 015-combat-arena
 */

import GridSquare from './GridSquare';
import PokemonToken from './PokemonToken';
import styles from './BattleGrid.module.css';
import { toGridNotation } from '../../lib/gridUtils';

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/**
 * BattleGrid - The main 10x10 battle arena
 *
 * @param {Object} props
 * @param {Array<Array<Object>>} props.grid - 10x10 grid state from battleState
 * @param {Object} props.combatants - { player: [], opponent: [] }
 * @param {Object} props.trainers - { player: { position }, opponent: { position } }
 * @param {string} props.phase - 'setup' or 'combat'
 * @param {string} props.selectedPokemonId - Currently selected Pokemon's combatant_id
 * @param {string} props.currentTurnId - Current turn's combatant_id
 * @param {Function} props.onCellClick - Handler for cell clicks
 * @param {Function} props.onPokemonClick - Handler for Pokemon clicks
 * @param {Array<{ col: number, row: number }>} props.highlightedCells - Cells to highlight
 * @param {string} props.highlightType - Type of highlight: 'move', 'attack', 'placement'
 * @param {Object} props.damageAnimations - Map of combatant_id to damage animation data
 * @param {boolean} props.disabled - Disable all interactions
 */
export default function BattleGrid({
  grid,
  combatants,
  trainers,
  phase = 'combat',
  selectedPokemonId = null,
  currentTurnId = null,
  onCellClick,
  onPokemonClick,
  highlightedCells = [],
  highlightType = null,
  damageAnimations = {},
  disabled = false
}) {
  // Build a map of positions to combatants for quick lookup
  const positionMap = new Map();

  const allCombatants = [
    ...(combatants?.player || []),
    ...(combatants?.opponent || [])
  ];

  for (const combatant of allCombatants) {
    if (combatant.position && combatant.current_hp > 0) {
      const key = `${combatant.position.col},${combatant.position.row}`;
      positionMap.set(key, combatant);
    }
  }

  // Check if a cell is highlighted
  const isHighlighted = (col, row) => {
    return highlightedCells.some(cell => cell.col === col && cell.row === row);
  };

  // Check if a cell is in deployment zone (rows 0-1 for player)
  const isDeploymentZone = (row) => {
    return phase === 'setup' && (row === 0 || row === 1);
  };

  // Check if cell contains a trainer
  const getTrainer = (col, row) => {
    if (trainers?.player?.position?.col === col && trainers?.player?.position?.row === row) {
      return 'player';
    }
    if (trainers?.opponent?.position?.col === col && trainers?.opponent?.position?.row === row) {
      return 'opponent';
    }
    return null;
  };

  // Handle cell click
  const handleCellClick = (cellInfo) => {
    if (onCellClick) {
      onCellClick(cellInfo);
    }
  };

  // Handle Pokemon click
  const handlePokemonClick = (combatantId) => {
    if (onPokemonClick) {
      onPokemonClick(combatantId);
    }
  };

  return (
    <div className={styles.battleGridContainer}>
      {/* Column labels (A-J) */}
      <div className={styles.columnLabels}>
        <div className={styles.cornerLabel}></div>
        {COLUMNS.map((col, index) => (
          <div key={col} className={styles.columnLabel}>
            {col}
          </div>
        ))}
      </div>

      {/* Grid with row labels */}
      <div className={styles.gridWithRows}>
        {/* Render grid rows */}
        {Array.from({ length: 10 }, (_, rowIndex) => (
          <div key={rowIndex} className={styles.gridRow}>
            {/* Row label (1-10) */}
            <div className={styles.rowLabel}>
              {rowIndex + 1}
            </div>

            {/* Grid cells */}
            {Array.from({ length: 10 }, (_, colIndex) => {
              const notation = toGridNotation(colIndex, rowIndex);
              const posKey = `${colIndex},${rowIndex}`;
              const combatant = positionMap.get(posKey);
              const trainer = getTrainer(colIndex, rowIndex);
              const highlighted = isHighlighted(colIndex, rowIndex);
              const deploymentZone = isDeploymentZone(rowIndex);

              return (
                <GridSquare
                  key={notation}
                  col={colIndex}
                  row={rowIndex}
                  notation={notation}
                  isHighlighted={highlighted}
                  highlightType={highlighted ? highlightType : null}
                  isSelected={combatant?.combatant_id === selectedPokemonId}
                  isDeploymentZone={deploymentZone}
                  onClick={handleCellClick}
                  disabled={disabled}
                >
                  {/* Render Pokemon if present */}
                  {combatant && (
                    <PokemonToken
                      combatantId={combatant.combatant_id}
                      pokemonId={combatant.pokemon_id}
                      name={combatant.name}
                      currentHp={combatant.current_hp}
                      maxHp={combatant.max_hp}
                      owner={combatant.owner}
                      isSelected={combatant.combatant_id === selectedPokemonId}
                      isCurrentTurn={combatant.combatant_id === currentTurnId}
                      isFainted={combatant.current_hp <= 0}
                      statusEffects={combatant.status_effects || []}
                      damageAnimation={damageAnimations[combatant.combatant_id]}
                      onClick={handlePokemonClick}
                      disabled={disabled}
                    />
                  )}

                  {/* Render trainer sprite if present */}
                  {trainer && !combatant && (
                    <div className={`${styles.trainerSprite} ${styles[trainer]}`}>
                      <img
                        src={`/images/trainers/${trainer}.png`}
                        alt={`${trainer} trainer`}
                        className={styles.trainerImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </GridSquare>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
