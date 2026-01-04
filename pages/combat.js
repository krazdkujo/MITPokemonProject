/**
 * Combat Arena Page
 *
 * 10x10 grid-based Pokemon battle interface.
 * Supports setup phase (Pokemon placement) and combat phase (turn-based battles).
 *
 * Feature: 015-combat-arena
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import GameLayout from '../components/layout/GameLayout';
import BattleGrid from '../components/Combat/BattleGrid';
import MoveSelector from '../components/Combat/MoveSelector';
import TurnIndicator from '../components/Combat/TurnIndicator';
import { useGame } from '../lib/gameContext';
import {
  initializeBattleState,
  updateCombatantPosition,
  updateCombatantHp,
  addLogEntry,
  transitionToCombat,
  transitionToEnded,
  getCurrentCombatant,
  findCombatant,
  advanceTurn,
  checkVictory,
  checkDefeat,
  setSelection,
  clearSelection
} from '../lib/battleState';
import { toGridNotation, initializeGrid } from '../lib/gridUtils';
import { apiFetch } from '../lib/apiFetch';

/**
 * Combat Page Component
 */
export default function CombatPage() {
  const router = useRouter();
  const { party, refreshData } = useGame();

  // Battle state
  const [battleState, setBattleState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [highlightType, setHighlightType] = useState(null);
  const [damageAnimations, setDamageAnimations] = useState({});
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedMove, setSelectedMove] = useState(null);
  const [battleResult, setBattleResult] = useState(null);

  // Get query parameters for battle initialization
  const { opponent_id, opponent_level, battle_type, battle_id } = router.query;

  // Initialize battle on mount - check for active battle or start new one
  useEffect(() => {
    if (!router.isReady) return;

    // If we have a battle_id, load that battle
    if (battle_id) {
      loadBattleFromDb(battle_id);
      return;
    }

    // Check for active battle first
    checkForActiveBattle();
  }, [router.isReady, battle_id]);

  /**
   * Check for an active battle and load it, or initialize new battle
   */
  const checkForActiveBattle = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/battle/active');
      const data = await response.json();

      if (data.success && data.data.has_active_battle) {
        // Load the active battle
        await loadBattleFromDb(data.data.battle.battle_id);
      } else if (opponent_id && opponent_level) {
        // No active battle, but we have params to start new one
        initializeBattle();
      } else {
        // No active battle and no params - redirect to zones
        router.push('/zones');
      }
    } catch (err) {
      console.error('Error checking active battle:', err);
      if (opponent_id && opponent_level) {
        initializeBattle();
      } else {
        router.push('/zones');
      }
    }
  };

  /**
   * Load a battle from the database by ID
   */
  const loadBattleFromDb = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/battle/state/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to load battle');
      }

      const battleData = data.data;

      // Initialize a fresh grid
      const grid = initializeGrid();

      // Place combatants on the grid based on their positions
      const combatants = battleData.combatants || { player: [], opponent: [] };
      for (const owner of ['player', 'opponent']) {
        for (const combatant of combatants[owner] || []) {
          if (combatant.position) {
            const { col, row } = combatant.position;
            if (grid[row] && grid[row][col]) {
              grid[row][col].occupant_type = 'pokemon';
              grid[row][col].occupant_id = combatant.combatant_id;
            }
          }
        }
      }

      // Reconstruct battle state from database
      const state = {
        battle_id: battleData.battle_id,
        battle_type: battleData.battle_type || 'wild',
        phase: battleData.phase || 'setup',
        grid: grid,
        combatants: combatants,
        trainers: battleData.trainers || {
          player: { col: 0, row: 4 },
          opponent: { col: 9, row: 4 }
        },
        initiative_order: battleData.initiative_order || [],
        current_turn_index: battleData.current_turn_index || 0,
        round_number: battleData.round_number || 0,
        battle_log: battleData.battle_log || [],
        outcome: battleData.outcome || 'ongoing',
        zone: battleData.zone,
        selected: { pokemon: null, move: null, action: null }
      };

      setBattleState(state);

      // Set up UI based on phase
      if (state.phase === 'setup') {
        const deploymentCells = [];
        for (let col = 0; col < 10; col++) {
          for (let row = 0; row < 2; row++) {
            deploymentCells.push({ col, row });
          }
        }
        setHighlightedCells(deploymentCells);
        setHighlightType('placement');
      }

    } catch (err) {
      console.error('Load battle error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle opponent AI turn
  useEffect(() => {
    if (!battleState || battleState.phase !== 'combat' || actionInProgress) return;

    const currentCombatant = getCurrentCombatant(battleState);
    if (currentCombatant?.owner === 'opponent') {
      executeOpponentTurn(currentCombatant);
    }
  }, [battleState?.current_turn_index, battleState?.phase]);

  /**
   * Initialize a new battle via API
   */
  const initializeBattle = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch fresh party data directly from API to avoid stale cache issues
      const partyResponse = await apiFetch('/api/player/pokemon');
      const partyData = await partyResponse.json();

      if (!partyResponse.ok || !partyData.success) {
        throw new Error('Failed to fetch party data');
      }

      const freshParty = partyData.data?.pokemon || [];

      // Get active party Pokemon IDs
      const activePokemon = freshParty.filter(p => p.current_hp > 0);

      if (activePokemon.length === 0) {
        setError('All your Pokemon have fainted! Visit the Pokemon Center to heal.');
        setLoading(false);
        return;
      }

      // Refresh context in background so UI stays in sync
      refreshData();

      const playerPokemonIds = activePokemon.map(p => p.id);

      const response = await apiFetch('/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_pokemon_ids: playerPokemonIds,
          opponent_pokemon_id: opponent_id,
          opponent_level: parseInt(opponent_level, 10),
          battle_type: battle_type || 'wild',
          grid_mode: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to start battle');
      }

      // Initialize client-side battle state
      const state = initializeBattleState({
        battle_id: data.data.battle_id,
        battle_type: data.data.battle_type,
        playerPokemon: data.data.player_pokemon,
        opponentPokemon: data.data.opponent_pokemon,
        initiative_order: data.data.initiative_order
      });

      // Add initial log entry
      const stateWithLog = addLogEntry(state, {
        type: 'round_start',
        actor: 'System',
        result: 'Battle started! Place your Pokemon in the deployment zone (rows 1-2).'
      });

      setBattleState(stateWithLog);

      // Highlight deployment zone
      const deploymentCells = [];
      for (let col = 0; col < 10; col++) {
        for (let row = 0; row < 2; row++) {
          deploymentCells.push({ col, row });
        }
      }
      setHighlightedCells(deploymentCells);
      setHighlightType('placement');

    } catch (err) {
      console.error('Battle initialization error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle party Pokemon selection for placement
   */
  const handlePartyPokemonSelect = (combatantId) => {
    if (!battleState || battleState.phase !== 'setup') return;

    const pokemon = battleState.combatants.player.find(p => p.combatant_id === combatantId);
    if (!pokemon || pokemon.position) return;

    setPendingPlacement(combatantId);
    setBattleState(setSelection(battleState, { pokemon: combatantId }));
  };

  /**
   * Handle grid cell click
   */
  const handleCellClick = useCallback((cellInfo) => {
    if (!battleState || actionInProgress) return;

    const { col, row } = cellInfo;

    if (battleState.phase === 'setup') {
      handlePlacement(col, row);
      return;
    }

    if (battleState.phase === 'combat') {
      handleCombatCellClick(col, row);
    }
  }, [battleState, pendingPlacement, selectedMove, actionInProgress]);

  /**
   * Handle Pokemon placement during setup phase
   */
  const handlePlacement = (col, row) => {
    if (!pendingPlacement) return;

    if (row > 1) {
      setError('You can only place Pokemon in the deployment zone (rows 1-2).');
      return;
    }

    const isOccupied = [...battleState.combatants.player, ...battleState.combatants.opponent]
      .some(p => p.position?.col === col && p.position?.row === row);

    if (isOccupied) {
      setError('This cell is already occupied.');
      return;
    }

    try {
      const newState = updateCombatantPosition(battleState, pendingPlacement, { col, row });
      const pokemonName = newState.combatants.player.find(p => p.combatant_id === pendingPlacement)?.name;
      const notation = toGridNotation(col, row);

      const stateWithLog = addLogEntry(newState, {
        type: 'move',
        actor: pokemonName,
        result: `Deployed to ${notation}`
      });

      setBattleState(clearSelection(stateWithLog));
      setPendingPlacement(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Handle cell click during combat phase - target selection
   */
  const handleCombatCellClick = (col, row) => {
    if (!selectedMove) return;

    // Find if there's an opponent at this position
    const target = battleState.combatants.opponent.find(
      p => p.position?.col === col && p.position?.row === row && p.current_hp > 0
    );

    if (target) {
      executeAttack(target.combatant_id);
    }
  };

  /**
   * Handle Pokemon click on grid
   */
  const handlePokemonClick = useCallback((combatantId) => {
    if (!battleState || actionInProgress) return;

    if (battleState.phase === 'setup') return;

    if (battleState.phase === 'combat') {
      const pokemon = [...battleState.combatants.player, ...battleState.combatants.opponent]
        .find(p => p.combatant_id === combatantId);

      if (!pokemon) return;

      // If we have a move selected and clicking an opponent, attack
      if (selectedMove && pokemon.owner === 'opponent' && pokemon.current_hp > 0) {
        executeAttack(combatantId);
        return;
      }

      // Select player's Pokemon if it's their turn
      const currentCombatant = getCurrentCombatant(battleState);
      if (pokemon.owner === 'player' && pokemon.combatant_id === currentCombatant?.combatant_id) {
        setBattleState(setSelection(battleState, { pokemon: combatantId }));
      }
    }
  }, [battleState, selectedMove, actionInProgress]);

  /**
   * Handle move selection
   */
  const handleMoveSelect = (move) => {
    setSelectedMove(move);

    // Highlight valid targets (opponent Pokemon)
    const targets = battleState.combatants.opponent
      .filter(p => p.current_hp > 0 && p.position)
      .map(p => ({ col: p.position.col, row: p.position.row }));

    setHighlightedCells(targets);
    setHighlightType('attack');
  };

  /**
   * Execute an attack action
   */
  const executeAttack = async (targetId) => {
    if (!selectedMove || actionInProgress) return;

    const currentCombatant = getCurrentCombatant(battleState);
    if (!currentCombatant) return;

    setActionInProgress(true);
    setError(null);

    try {
      const response = await apiFetch('/api/battle/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battle_id: battleState.battle_id,
          battle_state: {
            combatants: battleState.combatants,
            current_turn_index: battleState.current_turn_index,
            initiative_order: battleState.initiative_order,
            round_number: battleState.round_number
          },
          action_type: 'attack',
          actor_id: currentCombatant.combatant_id,
          move_id: selectedMove.id,
          target_id: targetId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Attack failed');
      }

      // Process the attack result
      processAttackResult(data.data, currentCombatant.combatant_id, targetId);

    } catch (err) {
      console.error('Attack error:', err);
      setError(err.message);
    } finally {
      setActionInProgress(false);
      setSelectedMove(null);
      setHighlightedCells([]);
      setHighlightType(null);
    }
  };

  /**
   * Process attack result and update state
   */
  const processAttackResult = (result, actorId, targetId) => {
    let newState = { ...battleState };

    // Update target HP
    if (result.target) {
      newState = updateCombatantHp(newState, targetId, result.target.hp_after);

      // Show damage animation
      if (result.attack_result?.hit && result.attack_result?.damage) {
        setDamageAnimations({
          [targetId]: {
            value: result.attack_result.damage.final_damage,
            key: Date.now()
          }
        });
      }
    }

    // Update actor's PP
    const actorOwner = battleState.combatants.player.find(p => p.combatant_id === actorId) ? 'player' : 'opponent';
    const actorIndex = newState.combatants[actorOwner].findIndex(p => p.combatant_id === actorId);
    if (actorIndex !== -1 && result.attack_result) {
      newState.combatants[actorOwner][actorIndex] = {
        ...newState.combatants[actorOwner][actorIndex],
        move_pp: {
          ...newState.combatants[actorOwner][actorIndex].move_pp,
          [selectedMove.id]: result.attack_result.pp_remaining
        }
      };
    }

    // Add log entry
    const actor = findCombatant(battleState, actorId);
    const target = findCombatant(battleState, targetId);
    const hitMiss = result.attack_result?.hit ? 'Hit' : 'Miss';
    const damage = result.attack_result?.damage?.final_damage || 0;

    newState = addLogEntry(newState, {
      type: 'attack',
      actor: actor?.name,
      target: target?.name,
      move: selectedMove.name,
      result: result.attack_result?.hit
        ? `${hitMiss}! ${damage} damage${result.target?.fainted ? ' - FAINTED!' : ''}`
        : 'Miss!'
    });

    // Check for battle end
    if (result.outcome === 'victory') {
      newState = transitionToEnded(newState, 'victory');
      setBattleResult({
        outcome: 'victory',
        rewards: result.rewards
      });
    } else if (result.outcome === 'defeat') {
      newState = transitionToEnded(newState, 'defeat');
      setBattleResult({ outcome: 'defeat' });
    } else {
      // Advance turn
      newState = advanceTurn(newState);
    }

    setBattleState(clearSelection(newState));
  };

  /**
   * Execute opponent AI turn
   */
  const executeOpponentTurn = async (opponent) => {
    setActionInProgress(true);

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Select a random move with PP
    const availableMoves = (opponent.known_moves || []).filter(move => {
      const pp = opponent.move_pp?.[move.id] ?? move.pp ?? 1;
      return pp > 0;
    });

    if (availableMoves.length === 0) {
      // No moves available, skip turn
      const newState = advanceTurn(battleState);
      setBattleState(newState);
      setActionInProgress(false);
      return;
    }

    const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];

    // Select a random player target
    const playerTargets = battleState.combatants.player.filter(p => p.current_hp > 0);
    if (playerTargets.length === 0) {
      setActionInProgress(false);
      return;
    }

    const target = playerTargets[Math.floor(Math.random() * playerTargets.length)];

    try {
      const response = await apiFetch('/api/battle/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battle_id: battleState.battle_id,
          battle_state: {
            combatants: battleState.combatants,
            current_turn_index: battleState.current_turn_index,
            initiative_order: battleState.initiative_order,
            round_number: battleState.round_number
          },
          action_type: 'attack',
          actor_id: opponent.combatant_id,
          move_id: move.id,
          target_id: target.combatant_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedMove(move); // Temporarily set for processAttackResult
        processAttackResult(data.data, opponent.combatant_id, target.combatant_id);
      }
    } catch (err) {
      console.error('Opponent turn error:', err);
    } finally {
      setActionInProgress(false);
      setSelectedMove(null);
    }
  };

  /**
   * Handle flee attempt
   */
  const handleFlee = async () => {
    if (battleState.battle_type !== 'wild') {
      setError("Can't flee from trainer battles!");
      return;
    }

    const currentCombatant = getCurrentCombatant(battleState);
    if (!currentCombatant || currentCombatant.owner !== 'player') return;

    setActionInProgress(true);

    try {
      const response = await apiFetch('/api/battle/flee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battle_id: battleState.battle_id,
          battle_state: {
            battle_type: battleState.battle_type,
            combatants: battleState.combatants,
            current_turn_index: battleState.current_turn_index,
            initiative_order: battleState.initiative_order,
            phase: battleState.phase,
            outcome: battleState.outcome
          },
          actor_id: currentCombatant.combatant_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Flee attempt failed');
      }

      if (data.data.fled) {
        const newState = transitionToEnded(battleState, 'fled');
        setBattleState(addLogEntry(newState, {
          type: 'flee',
          actor: currentCombatant.name,
          result: 'Got away safely!'
        }));
        setBattleResult({ outcome: 'fled' });
      } else {
        // Flee failed, advance turn
        let newState = addLogEntry(battleState, {
          type: 'flee',
          actor: currentCombatant.name,
          result: "Can't escape!"
        });
        newState = advanceTurn(newState);
        setBattleState(newState);
      }
    } catch (err) {
      console.error('Flee error:', err);
      setError(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  /**
   * Start the battle (transition from setup to combat)
   */
  const handleStartBattle = () => {
    if (!battleState || battleState.phase !== 'setup') return;

    const placedPokemon = battleState.combatants.player.filter(p => p.position);
    if (placedPokemon.length === 0) {
      setError('You must place at least one Pokemon before starting the battle.');
      return;
    }

    const combatState = transitionToCombat(battleState);
    const currentCombatant = getCurrentCombatant(combatState);
    const stateWithLog = addLogEntry(combatState, {
      type: 'round_start',
      actor: 'System',
      result: `Round 1 begins! ${currentCombatant?.name}'s turn.`
    });

    setBattleState(stateWithLog);
    setHighlightedCells([]);
    setHighlightType(null);
    setError(null);
  };

  /**
   * Handle battle end continue button
   */
  const handleBattleEndContinue = async () => {
    // Refresh party data
    await refreshData();

    // Navigate based on outcome
    if (battleResult?.outcome === 'defeat') {
      router.push('/pokecenter');
    } else {
      router.push('/zones');
    }
  };

  /**
   * Handle abandon battle
   */
  const handleAbandon = async () => {
    if (!battleState || battleState.battle_type !== 'wild') return;

    if (!confirm('Abandon battle? This counts as fleeing.')) return;

    setActionInProgress(true);

    try {
      const response = await apiFetch('/api/battle/abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battle_id: battleState.battle_id })
      });

      const data = await response.json();

      if (response.ok && data.data.outcome === 'abandoned') {
        setBattleState(null);
        router.push('/zones');
      } else {
        throw new Error(data.error?.message || 'Failed to abandon battle');
      }
    } catch (err) {
      console.error('Abandon error:', err);
      setError(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  /**
   * Get unplaced Pokemon for the party panel
   */
  const getUnplacedPokemon = () => {
    if (!battleState) return [];
    return battleState.combatants.player.filter(p => !p.position);
  };

  /**
   * Get sorted combatants for turn indicator
   */
  const getSortedCombatants = () => {
    if (!battleState?.initiative_order) return [];
    return battleState.initiative_order.map(id => findCombatant(battleState, id)).filter(Boolean);
  };

  // Loading state
  if (loading) {
    return (
      <GameLayout>
        <div className="combat-loading">
          <div className="spinner"></div>
          <p>Preparing battle arena...</p>
        </div>
        <style jsx>{`
          .combat-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: white;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.2);
            border-top-color: #fbbf24;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </GameLayout>
    );
  }

  // Error state (no battle)
  if (error && !battleState) {
    return (
      <GameLayout>
        <div className="combat-error">
          <h2>Cannot Start Battle</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/wild')}>Return to Wild Area</button>
        </div>
        <style jsx>{`
          .combat-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: white;
            text-align: center;
          }
          .combat-error h2 {
            color: #f87171;
            margin-bottom: 16px;
          }
          .combat-error p {
            margin-bottom: 24px;
            color: rgba(255,255,255,0.8);
          }
          .combat-error button {
            padding: 12px 24px;
            background: #fbbf24;
            color: #1a1a2e;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }
        `}</style>
      </GameLayout>
    );
  }

  const currentCombatant = battleState ? getCurrentCombatant(battleState) : null;
  const isPlayerTurn = currentCombatant?.owner === 'player';

  return (
    <GameLayout>
      <div className="combat-page">
        {/* Battle End Overlay */}
        {battleResult && (
          <div className="battle-end-overlay">
            <div className="battle-end-modal">
              <h2 className={`outcome-${battleResult.outcome}`}>
                {battleResult.outcome === 'victory' && 'Victory!'}
                {battleResult.outcome === 'defeat' && 'Defeat...'}
                {battleResult.outcome === 'fled' && 'Got Away!'}
              </h2>
              {battleResult.rewards && (
                <div className="rewards">
                  <p>Rewards:</p>
                  <p>XP: {battleResult.rewards.xp_awarded}</p>
                  <p>Currency: {battleResult.rewards.currency_awarded}</p>
                </div>
              )}
              <button onClick={handleBattleEndContinue}>
                {battleResult.outcome === 'defeat' ? 'Go to Pokemon Center' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="combat-header">
          <h1>Combat Arena</h1>
          {battleState && (
            <div className="battle-info">
              <span className="phase-badge">
                {battleState.phase === 'setup' ? 'Setup Phase' : `Round ${battleState.round_number}`}
              </span>
              {battleState.phase === 'combat' && currentCombatant && (
                <span className="turn-info">{currentCombatant.name}'s Turn</span>
              )}
            </div>
          )}
        </div>

        {/* Turn Indicator */}
        {battleState?.phase === 'combat' && (
          <TurnIndicator
            combatants={getSortedCombatants()}
            currentTurnId={currentCombatant?.combatant_id}
            roundNumber={battleState.round_number}
          />
        )}

        {/* Error message */}
        {error && (
          <div className="combat-error-message">
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="combat-content">
          {/* Party Panel (Setup Phase) */}
          {battleState?.phase === 'setup' && (
            <div className="party-panel">
              <h3>Your Party</h3>
              <p className="panel-hint">Click a Pokemon, then click a cell in rows 1-2 to place it.</p>
              <div className="party-list">
                {getUnplacedPokemon().map(pokemon => (
                  <div
                    key={pokemon.combatant_id}
                    className={`party-item ${pendingPlacement === pokemon.combatant_id ? 'selected' : ''}`}
                    onClick={() => handlePartyPokemonSelect(pokemon.combatant_id)}
                  >
                    <img
                      src={`/images/pokemon/${pokemon.number}.png`}
                      alt={pokemon.name}
                      className="party-sprite"
                      onError={(e) => {
                        if (!e.target.dataset.fallback) {
                          e.target.dataset.fallback = 'true';
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                    <div className="party-info">
                      <span className="party-name">{pokemon.name}</span>
                      <span className="party-hp">HP: {pokemon.current_hp}/{pokemon.max_hp}</span>
                    </div>
                  </div>
                ))}
                {getUnplacedPokemon().length === 0 && (
                  <p className="all-placed">All Pokemon placed!</p>
                )}
              </div>
              <button
                className="start-battle-btn"
                onClick={handleStartBattle}
                disabled={getUnplacedPokemon().length === battleState.combatants.player.length}
              >
                Start Battle
              </button>
            </div>
          )}

          {/* Battle Grid */}
          <div className="grid-container">
            {battleState && (
              <BattleGrid
                grid={battleState.grid}
                combatants={battleState.combatants}
                trainers={battleState.trainers}
                phase={battleState.phase}
                selectedPokemonId={battleState.selected?.pokemon}
                currentTurnId={currentCombatant?.combatant_id}
                onCellClick={handleCellClick}
                onPokemonClick={handlePokemonClick}
                highlightedCells={highlightedCells}
                highlightType={highlightType}
                damageAnimations={damageAnimations}
                disabled={actionInProgress || (battleState.phase === 'combat' && !isPlayerTurn)}
              />
            )}
          </div>

          {/* Battle Controls (Combat Phase) */}
          {battleState?.phase === 'combat' && (
            <div className="battle-controls">
              <h3>Actions</h3>
              {isPlayerTurn && currentCombatant ? (
                <>
                  <p className="panel-hint">
                    {selectedMove
                      ? `Select a target for ${selectedMove.name}`
                      : 'Select a move, then click an enemy to attack'}
                  </p>
                  <MoveSelector
                    moves={currentCombatant.known_moves || []}
                    movePp={currentCombatant.move_pp || {}}
                    selectedMoveId={selectedMove?.id}
                    onMoveSelect={handleMoveSelect}
                    disabled={actionInProgress}
                  />
                  {battleState.battle_type === 'wild' && (
                    <>
                      <button
                        className="flee-btn"
                        onClick={handleFlee}
                        disabled={actionInProgress}
                      >
                        Flee
                      </button>
                      <button
                        className="abandon-btn"
                        onClick={handleAbandon}
                        disabled={actionInProgress}
                        data-testid="abandon-btn"
                      >
                        Abandon Battle
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p className="panel-hint">Waiting for opponent...</p>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .combat-page {
          color: white;
          position: relative;
        }

        .battle-end-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .battle-end-modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 40px 60px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .battle-end-modal h2 {
          font-size: 32px;
          margin-bottom: 24px;
        }

        .outcome-victory {
          color: #4ade80;
        }

        .outcome-defeat {
          color: #f87171;
        }

        .outcome-fled {
          color: #fbbf24;
        }

        .rewards {
          margin-bottom: 24px;
          color: rgba(255, 255, 255, 0.8);
        }

        .rewards p {
          margin: 8px 0;
        }

        .battle-end-modal button {
          padding: 12px 32px;
          background: #fbbf24;
          color: #1a1a2e;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
        }

        .combat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .combat-header h1 {
          margin: 0;
          font-size: 28px;
        }

        .battle-info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .phase-badge {
          background: #4a90d9;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .turn-info {
          font-size: 16px;
          color: #fbbf24;
        }

        .combat-error-message {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .combat-error-message button {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .combat-content {
          display: flex;
          gap: 24px;
        }

        .party-panel,
        .battle-controls {
          width: 250px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 16px;
        }

        .party-panel h3,
        .battle-controls h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }

        .panel-hint {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 16px;
        }

        .party-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .party-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.1);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .party-item:hover {
          background: rgba(255,255,255,0.2);
        }

        .party-item.selected {
          background: rgba(251, 191, 36, 0.3);
          box-shadow: 0 0 0 2px #fbbf24;
        }

        .party-sprite {
          width: 40px;
          height: 40px;
          image-rendering: pixelated;
        }

        .party-info {
          display: flex;
          flex-direction: column;
        }

        .party-name {
          font-weight: 600;
        }

        .party-hp {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
        }

        .all-placed {
          text-align: center;
          color: #4ade80;
          font-style: italic;
        }

        .start-battle-btn {
          width: 100%;
          padding: 12px;
          background: #4ade80;
          color: #1a1a2e;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .start-battle-btn:hover:not(:disabled) {
          background: #22c55e;
        }

        .start-battle-btn:disabled {
          background: #666;
          color: #999;
          cursor: not-allowed;
        }

        .flee-btn {
          width: 100%;
          padding: 10px;
          margin-top: 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          color: white;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .flee-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.4);
        }

        .flee-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .abandon-btn {
          width: 100%;
          padding: 8px;
          margin-top: 8px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.6);
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .abandon-btn:hover:not(:disabled) {
          border-color: #f87171;
          color: #f87171;
        }

        .abandon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .grid-container {
          flex: 1;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </GameLayout>
  );
}
