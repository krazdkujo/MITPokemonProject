/**
 * PokemonSelector Component
 * Dropdown to select a Pokemon, set its level, and choose moves for combat testing
 *
 * Feature: 021-combat-test-harness
 * Tasks: T007, T015, T016
 */

import { useState, useEffect } from 'react';

/**
 * PokemonSelector - Select a Pokemon, level, and moves for combat testing
 *
 * @param {Object} props
 * @param {string} props.label - Label for the selector (e.g., "Pokemon 1")
 * @param {Array} props.pokemonList - Array of Pokemon objects with id, name, number
 * @param {string} props.selectedPokemon - Currently selected Pokemon ID
 * @param {number} props.selectedLevel - Currently selected level
 * @param {Array} props.selectedMoves - Currently selected move IDs (max 4)
 * @param {function} props.onPokemonChange - Callback when Pokemon selection changes
 * @param {function} props.onLevelChange - Callback when level changes
 * @param {function} props.onMovesChange - Callback when moves change
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
export default function PokemonSelector({
  label = 'Pokemon',
  pokemonList = [],
  selectedPokemon = '',
  selectedLevel = 5,
  selectedMoves = [],
  onPokemonChange,
  onLevelChange,
  onMovesChange,
  disabled = false
}) {
  const [levelError, setLevelError] = useState('');
  const [availableMoves, setAvailableMoves] = useState([]);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [showMoveSelector, setShowMoveSelector] = useState(false);

  // Fetch available moves when Pokemon or level changes
  useEffect(() => {
    async function fetchMoves() {
      if (!selectedPokemon) {
        setAvailableMoves([]);
        return;
      }

      setLoadingMoves(true);
      try {
        const res = await fetch(`/api/pokemon/moves?pokemonId=${selectedPokemon}&level=${selectedLevel}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableMoves(data.moves || []);
        } else {
          setAvailableMoves([]);
        }
      } catch (err) {
        console.error('Failed to fetch moves:', err);
        setAvailableMoves([]);
      }
      setLoadingMoves(false);
    }

    fetchMoves();
  }, [selectedPokemon, selectedLevel]);

  const handlePokemonChange = (e) => {
    if (onPokemonChange) {
      onPokemonChange(e.target.value);
    }
    // Clear moves when Pokemon changes
    if (onMovesChange) {
      onMovesChange([]);
    }
  };

  const handleLevelChange = (e) => {
    const value = parseInt(e.target.value, 10);

    // Validate level (1-20)
    if (isNaN(value) || value < 1) {
      setLevelError('Level must be at least 1');
    } else if (value > 20) {
      setLevelError('Level cannot exceed 20');
    } else {
      setLevelError('');
    }

    if (onLevelChange) {
      onLevelChange(isNaN(value) ? 1 : Math.max(1, Math.min(20, value)));
    }
  };

  const handleMoveToggle = (moveId) => {
    if (!onMovesChange) return;

    const currentMoves = selectedMoves || [];
    if (currentMoves.includes(moveId)) {
      // Remove move
      onMovesChange(currentMoves.filter(m => m !== moveId));
    } else if (currentMoves.length < 4) {
      // Add move (max 4)
      onMovesChange([...currentMoves, moveId]);
    }
  };

  const handleClearMoves = () => {
    if (onMovesChange) {
      onMovesChange([]);
    }
  };

  // Get sprite URL for selected Pokemon
  const selectedPokemonData = pokemonList.find(p => p.id === selectedPokemon);
  const spriteUrl = selectedPokemonData
    ? `/images/pokemon/${selectedPokemonData.number}.png`
    : null;

  return (
    <div style={styles.container}>
      <h3 style={styles.label}>{label}</h3>

      {/* Pokemon sprite preview */}
      <div style={styles.spriteContainer}>
        {spriteUrl ? (
          <img
            src={spriteUrl}
            alt={selectedPokemonData?.name || 'Pokemon'}
            style={styles.sprite}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={styles.spritePlaceholder}>?</div>
        )}
      </div>

      {/* Pokemon dropdown */}
      <div style={styles.field}>
        <label style={styles.fieldLabel}>Pokemon:</label>
        <select
          value={selectedPokemon}
          onChange={handlePokemonChange}
          disabled={disabled}
          style={styles.select}
        >
          <option value="">-- Select Pokemon --</option>
          {pokemonList.map(pokemon => (
            <option key={pokemon.id} value={pokemon.id}>
              #{pokemon.number} {pokemon.name}
            </option>
          ))}
        </select>
      </div>

      {/* Level input */}
      <div style={styles.field}>
        <label style={styles.fieldLabel}>Level:</label>
        <input
          type="number"
          min="1"
          max="20"
          value={selectedLevel}
          onChange={handleLevelChange}
          disabled={disabled}
          style={styles.input}
        />
        {levelError && <span style={styles.error}>{levelError}</span>}
      </div>

      {/* Type badges */}
      {selectedPokemonData?.type && (
        <div style={styles.types}>
          {selectedPokemonData.type.map(type => (
            <span key={type} style={{...styles.typeBadge, ...getTypeStyle(type)}}>
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Move Selection */}
      {selectedPokemon && (
        <div style={styles.moveSection}>
          <div style={styles.moveSectionHeader}>
            <label style={styles.fieldLabel}>
              Moves ({selectedMoves?.length || 0}/4):
            </label>
            <button
              type="button"
              onClick={() => setShowMoveSelector(!showMoveSelector)}
              disabled={disabled}
              style={styles.toggleButton}
            >
              {showMoveSelector ? 'Hide' : 'Select'}
            </button>
          </div>

          {/* Selected moves display */}
          {selectedMoves && selectedMoves.length > 0 && (
            <div style={styles.selectedMoves}>
              {selectedMoves.map(moveId => {
                const move = availableMoves.find(m => m.id === moveId);
                return (
                  <span key={moveId} style={styles.selectedMove}>
                    {move?.name || moveId}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleMoveToggle(moveId)}
                        style={styles.removeMove}
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
              {!disabled && selectedMoves.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMoves}
                  style={styles.clearButton}
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Move selector dropdown */}
          {showMoveSelector && !disabled && (
            <div style={styles.moveSelector}>
              {loadingMoves ? (
                <div style={styles.loading}>Loading moves...</div>
              ) : availableMoves.length === 0 ? (
                <div style={styles.noMoves}>No moves available</div>
              ) : (
                <div style={styles.moveList}>
                  {availableMoves.map(move => {
                    const isSelected = selectedMoves?.includes(move.id);
                    const canSelect = isSelected || (selectedMoves?.length || 0) < 4;
                    return (
                      <div
                        key={move.id}
                        style={{
                          ...styles.moveItem,
                          ...(isSelected ? styles.moveItemSelected : {}),
                          ...(!canSelect ? styles.moveItemDisabled : {})
                        }}
                        onClick={() => canSelect && handleMoveToggle(move.id)}
                      >
                        <span style={styles.moveName}>{move.name}</span>
                        <span style={{
                          ...styles.moveType,
                          ...getTypeStyle(move.type)
                        }}>
                          {move.type}
                        </span>
                        {move.pp && (
                          <span style={styles.movePP}>PP: {move.pp}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={styles.moveHint}>
                {selectedMoves?.length === 0
                  ? 'No moves selected = AI uses all available'
                  : 'Click to toggle moves'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Get CSS style for a Pokemon type badge
 * @param {string} type - Pokemon type name
 * @returns {Object} Style object
 */
function getTypeStyle(type) {
  const typeColors = {
    Normal: '#A8A878',
    Fire: '#F08030',
    Water: '#6890F0',
    Electric: '#F8D030',
    Grass: '#78C850',
    Ice: '#98D8D8',
    Fighting: '#C03028',
    Poison: '#A040A0',
    Ground: '#E0C068',
    Flying: '#A890F0',
    Psychic: '#F85888',
    Bug: '#A8B820',
    Rock: '#B8A038',
    Ghost: '#705898',
    Dragon: '#7038F8',
    Dark: '#705848',
    Steel: '#B8B8D0',
    Fairy: '#EE99AC'
  };

  const color = typeColors[type] || '#888888';
  return {
    backgroundColor: color,
    color: isLightColor(color) ? '#000' : '#fff'
  };
}

/**
 * Check if a color is light (for text contrast)
 * @param {string} hexColor - Hex color code
 * @returns {boolean} True if light
 */
function isLightColor(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

const styles = {
  container: {
    padding: '16px',
    border: '1px solid #333',
    borderRadius: '8px',
    backgroundColor: '#1a1a1a',
    width: '280px'
  },
  label: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  spriteContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '96px',
    marginBottom: '12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px'
  },
  sprite: {
    maxWidth: '96px',
    maxHeight: '96px',
    imageRendering: 'pixelated'
  },
  spritePlaceholder: {
    fontSize: '48px',
    color: '#555'
  },
  field: {
    marginBottom: '12px'
  },
  fieldLabel: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    color: '#aaa'
  },
  select: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  input: {
    width: '80px',
    padding: '8px',
    fontSize: '14px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px'
  },
  error: {
    display: 'block',
    marginTop: '4px',
    fontSize: '12px',
    color: '#ff4444'
  },
  types: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '8px'
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  moveSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #333'
  },
  moveSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  toggleButton: {
    padding: '4px 12px',
    fontSize: '12px',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  selectedMoves: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '8px'
  },
  selectedMove: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#3a3a3a',
    color: '#fff',
    borderRadius: '4px'
  },
  removeMove: {
    background: 'none',
    border: 'none',
    color: '#ff4444',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0 2px'
  },
  clearButton: {
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: '#444',
    color: '#aaa',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  moveSelector: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '8px'
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '8px',
    fontStyle: 'italic'
  },
  noMoves: {
    textAlign: 'center',
    color: '#666',
    padding: '8px'
  },
  moveList: {
    maxHeight: '150px',
    overflowY: 'auto'
  },
  moveItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    marginBottom: '4px',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  moveItemSelected: {
    backgroundColor: '#2a4a2a',
    border: '1px solid #4CAF50'
  },
  moveItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  moveName: {
    flex: 1,
    fontSize: '13px',
    color: '#fff'
  },
  moveType: {
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  movePP: {
    fontSize: '10px',
    color: '#888'
  },
  moveHint: {
    marginTop: '8px',
    fontSize: '11px',
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  }
};
