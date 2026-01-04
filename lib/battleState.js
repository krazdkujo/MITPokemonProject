/**
 * Battle State Management Utilities
 * Client-side state management for Combat Arena
 *
 * Feature: 015-combat-arena
 */

import { v4 as uuidv4 } from 'uuid';
import { initializeGrid, toGridNotation } from './gridUtils.js';

/**
 * Initialize a new battle state object
 * @param {Object} params - Battle initialization parameters
 * @param {string} params.battle_id - Battle identifier
 * @param {string} params.battle_type - 'wild', 'trainer', 'gym', 'pvp'
 * @param {Array<Object>} params.playerPokemon - Player's Pokemon combatants
 * @param {Array<Object>} params.opponentPokemon - Opponent's Pokemon combatants
 * @param {Array<string>} params.initiative_order - Initiative-sorted combatant IDs
 * @returns {Object} Initialized battle state
 */
export function initializeBattleState({
  battle_id,
  battle_type = 'wild',
  playerPokemon = [],
  opponentPokemon = [],
  initiative_order = []
}) {
  return {
    battle_id,
    battle_type,
    phase: 'setup',
    grid: initializeGrid(),
    combatants: {
      player: playerPokemon.map(p => ({ ...p, position: null, has_moved_this_turn: false })),
      opponent: opponentPokemon.map(p => ({ ...p, has_moved_this_turn: false }))
    },
    trainers: {
      player: { position: { col: 0, row: 4 }, sprite_id: 'player_trainer' },
      opponent: { position: { col: 9, row: 4 }, sprite_id: 'opponent_trainer' }
    },
    initiative_order,
    current_turn_index: 0,
    round_number: 0,
    battle_log: [],
    outcome: 'ongoing',
    started_at: new Date().toISOString(),
    selected: {
      pokemon: null,
      move: null,
      action: null
    }
  };
}

/**
 * Update a combatant's position on the grid
 * @param {Object} state - Current battle state
 * @param {string} combatant_id - Combatant to move
 * @param {{ col: number, row: number }} newPosition - New grid position
 * @returns {Object} Updated battle state
 */
export function updateCombatantPosition(state, combatant_id, newPosition) {
  const newState = { ...state };
  const newGrid = state.grid.map(row => row.map(cell => ({ ...cell })));

  // Find the combatant
  let combatant = null;
  let combatantOwner = null;

  for (const owner of ['player', 'opponent']) {
    const found = state.combatants[owner].find(c => c.combatant_id === combatant_id);
    if (found) {
      combatant = found;
      combatantOwner = owner;
      break;
    }
  }

  if (!combatant) {
    throw new Error(`Combatant not found: ${combatant_id}`);
  }

  // Clear old position
  if (combatant.position) {
    const oldCell = newGrid[combatant.position.row][combatant.position.col];
    oldCell.occupant_type = 'empty';
    oldCell.occupant_id = null;
  }

  // Set new position
  const newCell = newGrid[newPosition.row][newPosition.col];
  newCell.occupant_type = 'pokemon';
  newCell.occupant_id = combatant_id;

  // Update combatant position
  newState.combatants = {
    ...state.combatants,
    [combatantOwner]: state.combatants[combatantOwner].map(c =>
      c.combatant_id === combatant_id
        ? { ...c, position: { ...newPosition }, has_moved_this_turn: true }
        : c
    )
  };

  newState.grid = newGrid;
  return newState;
}

/**
 * Add an entry to the battle log
 * @param {Object} state - Current battle state
 * @param {Object} entry - Log entry data
 * @param {string} entry.type - Log type: 'attack', 'damage', 'faint', 'status', 'catch', 'flee', 'move', 'turn_start', 'round_start'
 * @param {string} entry.actor - Acting Pokemon name
 * @param {string} [entry.target] - Target Pokemon name
 * @param {string} [entry.move] - Move name
 * @param {string} entry.result - Human-readable result
 * @param {Object} [entry.details] - Type-specific details
 * @returns {Object} Updated battle state
 */
export function addLogEntry(state, entry) {
  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type: entry.type,
    actor: entry.actor,
    target: entry.target || null,
    move: entry.move || null,
    result: entry.result,
    details: entry.details || {}
  };

  return {
    ...state,
    battle_log: [...state.battle_log, logEntry]
  };
}

/**
 * Transition battle state to combat phase
 * @param {Object} state - Current battle state
 * @returns {Object} Updated battle state
 */
export function transitionToCombat(state) {
  return {
    ...state,
    phase: 'combat',
    round_number: 1
  };
}

/**
 * Transition battle state to ended phase
 * @param {Object} state - Current battle state
 * @param {string} outcome - 'victory', 'defeat', or 'fled'
 * @returns {Object} Updated battle state
 */
export function transitionToEnded(state, outcome) {
  return {
    ...state,
    phase: 'ended',
    outcome
  };
}

/**
 * Advance to the next turn in initiative order
 * @param {Object} state - Current battle state
 * @returns {Object} Updated battle state
 */
export function advanceTurn(state) {
  const activeCombatants = getActiveCombatants(state);
  if (activeCombatants.length === 0) {
    return state;
  }

  let nextIndex = (state.current_turn_index + 1) % state.initiative_order.length;

  // Skip fainted combatants
  let attempts = 0;
  while (attempts < state.initiative_order.length) {
    const nextCombatantId = state.initiative_order[nextIndex];
    const combatant = findCombatant(state, nextCombatantId);
    if (combatant && combatant.current_hp > 0) {
      break;
    }
    nextIndex = (nextIndex + 1) % state.initiative_order.length;
    attempts++;
  }

  // Check for new round
  const isNewRound = nextIndex <= state.current_turn_index;
  const newRoundNumber = isNewRound ? state.round_number + 1 : state.round_number;

  // Reset movement flags at start of round
  let newCombatants = state.combatants;
  if (isNewRound) {
    newCombatants = {
      player: state.combatants.player.map(c => ({ ...c, has_moved_this_turn: false })),
      opponent: state.combatants.opponent.map(c => ({ ...c, has_moved_this_turn: false }))
    };
  }

  return {
    ...state,
    current_turn_index: nextIndex,
    round_number: newRoundNumber,
    combatants: newCombatants,
    selected: {
      pokemon: null,
      move: null,
      action: null
    }
  };
}

/**
 * Get the current turn's combatant
 * @param {Object} state - Current battle state
 * @returns {Object|null} Current combatant or null
 */
export function getCurrentCombatant(state) {
  if (!state.initiative_order || state.initiative_order.length === 0) {
    return null;
  }
  const combatantId = state.initiative_order[state.current_turn_index];
  return findCombatant(state, combatantId);
}

/**
 * Find a combatant by ID
 * @param {Object} state - Current battle state
 * @param {string} combatant_id - Combatant ID to find
 * @returns {Object|null} Combatant or null
 */
export function findCombatant(state, combatant_id) {
  const player = state.combatants.player.find(c => c.combatant_id === combatant_id);
  if (player) return player;
  return state.combatants.opponent.find(c => c.combatant_id === combatant_id);
}

/**
 * Get all active (non-fainted) combatants
 * @param {Object} state - Current battle state
 * @returns {Array<Object>} Active combatants
 */
export function getActiveCombatants(state) {
  return [
    ...state.combatants.player.filter(c => c.current_hp > 0),
    ...state.combatants.opponent.filter(c => c.current_hp > 0)
  ];
}

/**
 * Check if all player Pokemon have fainted
 * @param {Object} state - Current battle state
 * @returns {boolean} True if defeat condition met
 */
export function checkDefeat(state) {
  return state.combatants.player.every(c => c.current_hp <= 0);
}

/**
 * Check if all opponent Pokemon have fainted
 * @param {Object} state - Current battle state
 * @returns {boolean} True if victory condition met
 */
export function checkVictory(state) {
  return state.combatants.opponent.every(c => c.current_hp <= 0);
}

/**
 * Update combatant HP after an attack
 * @param {Object} state - Current battle state
 * @param {string} combatant_id - Combatant that took damage
 * @param {number} newHp - New HP value
 * @returns {Object} Updated battle state
 */
export function updateCombatantHp(state, combatant_id, newHp) {
  const newState = { ...state };
  const newGrid = state.grid.map(row => row.map(cell => ({ ...cell })));

  for (const owner of ['player', 'opponent']) {
    const index = state.combatants[owner].findIndex(c => c.combatant_id === combatant_id);
    if (index !== -1) {
      const combatant = state.combatants[owner][index];
      const updatedCombatant = {
        ...combatant,
        current_hp: Math.max(0, newHp),
        is_fainted: newHp <= 0
      };

      // Remove from grid if fainted
      if (newHp <= 0 && combatant.position) {
        const cell = newGrid[combatant.position.row][combatant.position.col];
        cell.occupant_type = 'empty';
        cell.occupant_id = null;
      }

      newState.combatants = {
        ...state.combatants,
        [owner]: [
          ...state.combatants[owner].slice(0, index),
          updatedCombatant,
          ...state.combatants[owner].slice(index + 1)
        ]
      };
      break;
    }
  }

  newState.grid = newGrid;
  return newState;
}

/**
 * Update combatant status effects
 * @param {Object} state - Current battle state
 * @param {string} combatant_id - Combatant ID
 * @param {Array<Object>} status_effects - New status effects array
 * @returns {Object} Updated battle state
 */
export function updateCombatantStatus(state, combatant_id, status_effects) {
  for (const owner of ['player', 'opponent']) {
    const index = state.combatants[owner].findIndex(c => c.combatant_id === combatant_id);
    if (index !== -1) {
      return {
        ...state,
        combatants: {
          ...state.combatants,
          [owner]: [
            ...state.combatants[owner].slice(0, index),
            { ...state.combatants[owner][index], status_effects },
            ...state.combatants[owner].slice(index + 1)
          ]
        }
      };
    }
  }
  return state;
}

/**
 * Set grid highlight state for valid targets
 * @param {Object} state - Current battle state
 * @param {Array<{ col: number, row: number }>} positions - Positions to highlight
 * @param {string} highlightType - 'move', 'attack', 'placement', or null to clear
 * @returns {Object} Updated battle state
 */
export function setGridHighlights(state, positions, highlightType) {
  const newGrid = state.grid.map(row =>
    row.map(cell => ({
      ...cell,
      is_highlighted: false,
      highlight_type: null
    }))
  );

  if (highlightType && positions) {
    for (const pos of positions) {
      if (newGrid[pos.row] && newGrid[pos.row][pos.col]) {
        newGrid[pos.row][pos.col].is_highlighted = true;
        newGrid[pos.row][pos.col].highlight_type = highlightType;
      }
    }
  }

  return {
    ...state,
    grid: newGrid
  };
}

/**
 * Set selected Pokemon, move, or action
 * @param {Object} state - Current battle state
 * @param {Object} selection - Selection update
 * @param {string} [selection.pokemon] - Selected combatant_id
 * @param {string} [selection.move] - Selected move_id
 * @param {string} [selection.action] - Selected action type
 * @returns {Object} Updated battle state
 */
export function setSelection(state, selection) {
  return {
    ...state,
    selected: {
      ...state.selected,
      ...selection
    }
  };
}

/**
 * Clear all selections
 * @param {Object} state - Current battle state
 * @returns {Object} Updated battle state
 */
export function clearSelection(state) {
  return {
    ...state,
    selected: {
      pokemon: null,
      move: null,
      action: null
    }
  };
}
