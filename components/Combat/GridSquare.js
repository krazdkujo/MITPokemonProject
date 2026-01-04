/**
 * GridSquare Component
 * Renders a single cell in the Combat Arena grid
 *
 * Feature: 015-combat-arena
 */

import styles from './GridSquare.module.css';

/**
 * GridSquare - A single cell in the 10x10 battle grid
 *
 * @param {Object} props
 * @param {number} props.col - Column index (0-9)
 * @param {number} props.row - Row index (0-9)
 * @param {string} props.notation - Grid notation (e.g., "A1", "J10")
 * @param {React.ReactNode} props.children - Occupant component (PokemonToken, trainer sprite, etc.)
 * @param {boolean} props.isHighlighted - Whether this cell is highlighted
 * @param {string} props.highlightType - Type of highlight: 'move', 'attack', 'placement', null
 * @param {boolean} props.isSelected - Whether this cell is currently selected
 * @param {boolean} props.isDeploymentZone - Whether this cell is in the player's deployment zone
 * @param {Function} props.onClick - Click handler for cell selection
 * @param {boolean} props.disabled - Whether clicks are disabled
 */
export default function GridSquare({
  col,
  row,
  notation,
  children,
  isHighlighted = false,
  highlightType = null,
  isSelected = false,
  isDeploymentZone = false,
  onClick,
  disabled = false
}) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick({ col, row, notation });
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick({ col, row, notation });
    }
  };

  // Build class names
  const classNames = [styles.gridSquare];

  // Checkerboard pattern
  const isLight = (col + row) % 2 === 0;
  classNames.push(isLight ? styles.light : styles.dark);

  if (isHighlighted && highlightType) {
    classNames.push(styles.highlighted);
    classNames.push(styles[`highlight${highlightType.charAt(0).toUpperCase()}${highlightType.slice(1)}`]);
  }

  if (isSelected) {
    classNames.push(styles.selected);
  }

  if (isDeploymentZone) {
    classNames.push(styles.deploymentZone);
  }

  if (disabled) {
    classNames.push(styles.disabled);
  }

  if (onClick && !disabled) {
    classNames.push(styles.clickable);
  }

  return (
    <div
      className={classNames.join(' ')}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : 'cell'}
      tabIndex={onClick && !disabled ? 0 : -1}
      aria-label={`Grid cell ${notation}${children ? ', occupied' : ', empty'}${isHighlighted ? `, ${highlightType} target` : ''}`}
      data-col={col}
      data-row={row}
      data-notation={notation}
    >
      {children}
    </div>
  );
}
