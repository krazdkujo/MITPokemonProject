/**
 * Test Combat Page
 * Interactive combat test harness for debugging the Pokemon 5e battle system
 *
 * Feature: 021-combat-test-harness
 * Tasks: T010-T014, T017
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import PokemonSelector from '../components/TestCombat/PokemonSelector';
import BattleLog from '../components/TestCombat/BattleLog';
import ControlPanel from '../components/TestCombat/ControlPanel';
import BattleGrid from '../components/TestCombat/BattleGrid';
import { initializeGrid, toGridNotation, getValidMoveTargets, getCellsInRange, feetToCells, getValidAttackTargetsInRange } from '../lib/gridUtils';
import { executeMovement, getMovementTargets } from '../lib/movementUtils';
import RangeIndicator from '../components/TestCombat/RangeIndicator';
import MovementPanel from '../components/TestCombat/MovementPanel';

export default function TestCombatPage() {
  // Pokemon selection state
  const [pokemonList, setPokemonList] = useState([]);
  const [pokemon1Id, setPokemon1Id] = useState('');
  const [pokemon1Level, setPokemon1Level] = useState(5);
  const [pokemon1Moves, setPokemon1Moves] = useState([]);
  const [pokemon2Id, setPokemon2Id] = useState('');
  const [pokemon2Level, setPokemon2Level] = useState(5);
  const [pokemon2Moves, setPokemon2Moves] = useState([]);

  // Battle state
  const [battleState, setBattleState] = useState('idle'); // idle, ready, running, paused, ended
  const [simulation, setSimulation] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [winner, setWinner] = useState(null);
  const [battleSummary, setBattleSummary] = useState(null);

  // Control state
  const [mode, setMode] = useState('step'); // step or auto
  const [speed, setSpeed] = useState(500);
  const [seed, setSeed] = useState(null);
  const [displaySeed, setDisplaySeed] = useState(null);

  // Feature 023: Grid state for movement testing
  const [gridMode, setGridMode] = useState('view'); // 'view' | 'move' | 'attack'
  const [highlightedCells, setHighlightedCells] = useState({ movement: new Set(), attack: new Set() });
  const [selectedPokemon, setSelectedPokemon] = useState(null); // combatant_id of selected Pokemon
  const [selectedMove, setSelectedMove] = useState(null); // move object for range display
  const [gridCells, setGridCells] = useState(null); // 10x10 grid array
  const [rangeDisplayData, setRangeDisplayData] = useState(null); // Range indicator data

  // Auto-run interval ref
  const autoRunRef = useRef(null);

  // Quick battle state
  const [quickBattleLevel, setQuickBattleLevel] = useState(5);
  const [quickBattleSR, setQuickBattleSR] = useState('any'); // 'any' or specific SR value
  const [isGenerating, setIsGenerating] = useState(false);

  // Load Pokemon list on mount
  useEffect(() => {
    async function loadPokemon() {
      try {
        const res = await fetch('/api/pokemon');
        if (res.ok) {
          const data = await res.json();
          setPokemonList(data.pokemon || []);
        }
      } catch (err) {
        console.error('Failed to load Pokemon list:', err);
      }
    }
    loadPokemon();
  }, []);

  // Update battle state when both Pokemon selected
  useEffect(() => {
    if (pokemon1Id && pokemon2Id && battleState === 'idle') {
      setBattleState('ready');
    } else if ((!pokemon1Id || !pokemon2Id) && battleState === 'ready') {
      setBattleState('idle');
    }
  }, [pokemon1Id, pokemon2Id, battleState]);

  // Clear auto-run on unmount
  useEffect(() => {
    return () => {
      if (autoRunRef.current) {
        clearInterval(autoRunRef.current);
      }
    };
  }, []);

  // Generate random battle with two Pokemon at specified level
  const handleGenerateRandomBattle = useCallback(async () => {
    if (pokemonList.length < 2 || isGenerating) return;

    setIsGenerating(true);

    try {
      // Filter Pokemon by SR if specified
      let eligiblePokemon = pokemonList;
      if (quickBattleSR !== 'any') {
        const targetSR = parseFloat(quickBattleSR);
        eligiblePokemon = pokemonList.filter(p => p.sr === targetSR);
      }

      // Need at least 2 Pokemon matching the filter
      if (eligiblePokemon.length < 2) {
        console.warn(`Not enough Pokemon with SR ${quickBattleSR}, using all Pokemon`);
        eligiblePokemon = pokemonList;
      }

      // Pick two random different Pokemon
      const shuffled = [...eligiblePokemon].sort(() => Math.random() - 0.5);
      const poke1 = shuffled[0];
      const poke2 = shuffled[1];

      // Fetch moves for both Pokemon at the selected level
      const [moves1Res, moves2Res] = await Promise.all([
        fetch(`/api/pokemon/moves?pokemonId=${poke1.id}&level=${quickBattleLevel}`),
        fetch(`/api/pokemon/moves?pokemonId=${poke2.id}&level=${quickBattleLevel}`)
      ]);

      let moves1 = [];
      let moves2 = [];

      if (moves1Res.ok) {
        const data = await moves1Res.json();
        const available = data.moves || [];
        // Randomly select up to 4 moves
        const shuffledMoves = [...available].sort(() => Math.random() - 0.5);
        moves1 = shuffledMoves.slice(0, 4).map(m => m.id);
      }

      if (moves2Res.ok) {
        const data = await moves2Res.json();
        const available = data.moves || [];
        // Randomly select up to 4 moves
        const shuffledMoves = [...available].sort(() => Math.random() - 0.5);
        moves2 = shuffledMoves.slice(0, 4).map(m => m.id);
      }

      // Set all the state
      setPokemon1Id(poke1.id);
      setPokemon1Level(quickBattleLevel);
      setPokemon1Moves(moves1);
      setPokemon2Id(poke2.id);
      setPokemon2Level(quickBattleLevel);
      setPokemon2Moves(moves2);

      // Reset battle state
      setBattleState('ready');
    } catch (err) {
      console.error('Failed to generate random battle:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [pokemonList, quickBattleLevel, quickBattleSR, isGenerating]);

  // Start battle (T011, T017)
  const handleStart = useCallback(async () => {
    if (!pokemon1Id || !pokemon2Id) return;

    try {
      const res = await fetch('/api/test-combat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pokemon1: {
            id: pokemon1Id,
            level: pokemon1Level,
            moves: pokemon1Moves.length > 0 ? pokemon1Moves : null
          },
          pokemon2: {
            id: pokemon2Id,
            level: pokemon2Level,
            moves: pokemon2Moves.length > 0 ? pokemon2Moves : null
          },
          seed: seed
        })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to start battle:', error);
        return;
      }

      const data = await res.json();
      setSimulation(data.simulation);
      setDisplaySeed(data.simulation.seed);
      setLogEntries(data.initialLog || []);
      setBattleState('running');

      // Feature 023: Initialize grid for movement testing (T009)
      const grid = initializeGrid();
      setGridCells(grid);
      // Reset grid state
      setSelectedPokemon(null);
      setSelectedMove(null);
      setHighlightedCells({ movement: new Set(), attack: new Set() });
      setGridMode('view');
      setWinner(null);
      setBattleSummary(null);

      // If auto mode, start running
      if (mode === 'auto') {
        startAutoRun(data.simulation.id);
      }
    } catch (err) {
      console.error('Error starting battle:', err);
    }
  }, [pokemon1Id, pokemon1Level, pokemon1Moves, pokemon2Id, pokemon2Level, pokemon2Moves, seed, mode]);

  // Run next turn (T012)
  const handleNextTurn = useCallback(async () => {
    if (!simulation || battleState !== 'running') return;

    try {
      const res = await fetch('/api/test-combat/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simulation.id })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to run turn:', error);
        return;
      }

      const data = await res.json();

      // Add new log entries
      const newEntries = (data.log || []).map(entry => entry.formatted);
      setLogEntries(prev => [...prev, ...newEntries]);

      // Update simulation state
      setSimulation(prev => ({
        ...prev,
        currentTurn: data.turnNumber,
        combatant1: data.combatant1,
        combatant2: data.combatant2
      }));

      // Check for battle end (T014)
      if (data.battleEnded) {
        setBattleState('ended');
        setWinner(data.winner);

        // Stop auto-run if running
        if (autoRunRef.current) {
          clearInterval(autoRunRef.current);
          autoRunRef.current = null;
        }

        // Get final summary
        const summaryRes = await fetch(`/api/test-combat/summary?simulationId=${simulation.id}`);
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setBattleSummary(summaryData);
          setLogEntries(prev => [...prev, summaryData.formatted]);
        }
      }
    } catch (err) {
      console.error('Error running turn:', err);
    }
  }, [simulation, battleState]);

  // Auto-run logic (T013)
  const startAutoRun = useCallback((simId) => {
    if (autoRunRef.current) {
      clearInterval(autoRunRef.current);
    }

    autoRunRef.current = setInterval(async () => {
      // Need to check current state inside interval
      const currentState = battleState;
      if (currentState === 'ended' || currentState === 'paused') {
        clearInterval(autoRunRef.current);
        autoRunRef.current = null;
        return;
      }

      // Call the turn API directly here instead of handleNextTurn
      // because handleNextTurn may have stale closure
      try {
        const res = await fetch('/api/test-combat/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ simulationId: simId })
        });

        if (!res.ok) return;

        const data = await res.json();
        const newEntries = (data.log || []).map(entry => entry.formatted);
        setLogEntries(prev => [...prev, ...newEntries]);

        setSimulation(prev => ({
          ...prev,
          currentTurn: data.turnNumber,
          combatant1: data.combatant1,
          combatant2: data.combatant2
        }));

        if (data.battleEnded) {
          setBattleState('ended');
          setWinner(data.winner);
          clearInterval(autoRunRef.current);
          autoRunRef.current = null;

          const summaryRes = await fetch(`/api/test-combat/summary?simulationId=${simId}`);
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            setBattleSummary(summaryData);
            setLogEntries(prev => [...prev, summaryData.formatted]);
          }
        }
      } catch (err) {
        console.error('Error in auto-run:', err);
      }
    }, speed);
  }, [speed, battleState]);

  // Pause auto-run
  const handlePause = useCallback(() => {
    if (autoRunRef.current) {
      clearInterval(autoRunRef.current);
      autoRunRef.current = null;
    }
    setBattleState('paused');
  }, []);

  // Resume auto-run
  const handleResume = useCallback(() => {
    if (simulation) {
      setBattleState('running');
      startAutoRun(simulation.id);
    }
  }, [simulation, startAutoRun]);

  // Reset battle
  const handleReset = useCallback(() => {
    if (autoRunRef.current) {
      clearInterval(autoRunRef.current);
      autoRunRef.current = null;
    }
    setSimulation(null);
    setLogEntries([]);
    setWinner(null);
    setBattleSummary(null);
    setDisplaySeed(null);
    // Feature 023: Reset grid state (T013)
    setGridCells(null);
    setSelectedPokemon(null);
    setSelectedMove(null);
    setHighlightedCells({ movement: new Set(), attack: new Set() });
    setGridMode('view');
    // Don't clear moves on reset - user may want to rerun same config
    setBattleState(pokemon1Id && pokemon2Id ? 'ready' : 'idle');
  }, [pokemon1Id, pokemon2Id]);

  // Mode change - if switching to auto during a running battle, start auto-run
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    // If switching to auto mode during an active battle, start auto-run to finish it
    if (newMode === 'auto' && simulation && (battleState === 'running' || battleState === 'paused')) {
      setBattleState('running');
      startAutoRun(simulation.id);
    }
  }, [simulation, battleState, startAutoRun]);

  // Speed change
  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
  }, []);

  // Seed change
  const handleSeedChange = useCallback((newSeed) => {
    setSeed(newSeed);
  }, []);

  // Get winner display text
  const getWinnerText = () => {
    if (!winner) return null;
    if (winner === 'draw') return 'DRAW!';
    if (winner === 'player') {
      const p1 = pokemonList.find(p => p.id === pokemon1Id);
      return `${p1?.name || 'Pokemon 1'} WINS!`;
    }
    const p2 = pokemonList.find(p => p.id === pokemon2Id);
    return `${p2?.name || 'Pokemon 2'} WINS!`;
  };

  const isRunning = battleState === 'running' || battleState === 'paused';

  // Feature 023: Get occupied positions for movement validation
  const getOccupiedPositions = useCallback(() => {
    const positions = [];
    if (simulation?.combatant1?.position) {
      positions.push(simulation.combatant1.position);
    }
    if (simulation?.combatant2?.position) {
      positions.push(simulation.combatant2.position);
    }
    return positions;
  }, [simulation]);

  // Feature 023: Get selected combatant object (T034)
  const getSelectedCombatant = useCallback(() => {
    if (!selectedPokemon || !simulation) return null;
    if (simulation.combatant1?.combatant_id === selectedPokemon) {
      return simulation.combatant1;
    }
    if (simulation.combatant2?.combatant_id === selectedPokemon) {
      return simulation.combatant2;
    }
    return null;
  }, [selectedPokemon, simulation]);

  // Feature 023: Get movement state for MovementPanel (T034)
  const getMovementState = useCallback(() => {
    const combatant = getSelectedCombatant();
    if (!combatant) return null;
    return {
      walking_speed: combatant.walking_speed || 6,
      movement_remaining: combatant.movement_remaining ?? combatant.walking_speed ?? 6,
      has_moved_this_turn: combatant.has_moved_this_turn || false,
      walking_speed_feet: (combatant.walking_speed || 6) * 5
    };
  }, [getSelectedCombatant]);

  // Feature 023: Handler for MovementPanel "Move Pokemon" button (T033)
  const handleMovePanelClick = useCallback(() => {
    const combatant = getSelectedCombatant();
    if (!combatant || combatant.has_moved_this_turn) return;

    setGridMode('move');
    // Calculate and highlight valid movement targets
    const occupied = getOccupiedPositions();
    const { targets } = getMovementTargets(combatant, occupied);
    const movementSet = new Set(targets.map(t => toGridNotation(t.col, t.row)));
    setHighlightedCells({ movement: movementSet, attack: new Set() });
  }, [getSelectedCombatant, getOccupiedPositions]);

  // Feature 023: Handler for MovementPanel "Cancel" button (T033)
  const handleCancelMovePanel = useCallback(() => {
    setGridMode('view');
    setHighlightedCells({ movement: new Set(), attack: new Set() });
  }, []);

  // Feature 023: Handle Pokemon selection and movement (T015-T017)
  const handleCellClick = useCallback((col, row, notation) => {
    if (!simulation || battleState === 'ended') return;

    // Check if clicking on a Pokemon
    const clickedCombatant1 = simulation.combatant1?.position?.col === col &&
                              simulation.combatant1?.position?.row === row;
    const clickedCombatant2 = simulation.combatant2?.position?.col === col &&
                              simulation.combatant2?.position?.row === row;

    if (gridMode === 'view') {
      // T015, T034: Select Pokemon on click (for movement and MovementPanel display)
      if (clickedCombatant1) {
        const combatant = simulation.combatant1;
        // T042: Don't select fainted Pokemon
        if (combatant.current_hp <= 0) return;
        // Select combatant1 (for viewing stats in MovementPanel)
        setSelectedPokemon(combatant.combatant_id);
        // Only enter move mode if player's Pokemon and hasn't moved
        if (combatant.owner === 'player' && !combatant.has_moved_this_turn) {
          setGridMode('move');
          // T016: Calculate and highlight valid movement targets
          const occupied = getOccupiedPositions();
          const { targets } = getMovementTargets(combatant, occupied);
          const movementSet = new Set(targets.map(t => toGridNotation(t.col, t.row)));
          setHighlightedCells({ movement: movementSet, attack: new Set() });
        }
      } else if (clickedCombatant2) {
        const combatant = simulation.combatant2;
        // T042: Don't select fainted Pokemon
        if (combatant.current_hp <= 0) return;
        // Select combatant2 (for viewing stats in MovementPanel)
        setSelectedPokemon(combatant.combatant_id);
        // Only enter move mode if player's Pokemon and hasn't moved
        if (combatant.owner === 'player' && !combatant.has_moved_this_turn) {
          setGridMode('move');
          const occupied = getOccupiedPositions();
          const { targets } = getMovementTargets(combatant, occupied);
          const movementSet = new Set(targets.map(t => toGridNotation(t.col, t.row)));
          setHighlightedCells({ movement: movementSet, attack: new Set() });
        }
      } else {
        // Clicked empty cell - deselect
        setSelectedPokemon(null);
      }
    } else if (gridMode === 'move') {
      // T17: Execute movement or cancel selection
      if (highlightedCells.movement.has(notation)) {
        // T017: Execute movement to valid destination
        const occupied = getOccupiedPositions();
        const result = executeMovement(simulation, selectedPokemon, { col, row }, occupied);

        if (result.success) {
          // T038: Add movement log entry
          setLogEntries(prev => [...prev, result.logEntry.formatted]);

          // Update simulation state to reflect new position
          setSimulation(prev => ({
            ...prev,
            combatant1: prev.combatant1.combatant_id === selectedPokemon
              ? result.combatant
              : prev.combatant1,
            combatant2: prev.combatant2.combatant_id === selectedPokemon
              ? result.combatant
              : prev.combatant2
          }));

          // Clear selection
          setSelectedPokemon(null);
          setGridMode('view');
          setHighlightedCells({ movement: new Set(), attack: new Set() });
        } else {
          // T018: Movement validation error (expected, not logged)
        }
      } else if (clickedCombatant1 || clickedCombatant2) {
        // T018: Prevent movement to occupied cells - click ignored
      } else {
        // T021: Click outside valid targets - cancel movement
        setSelectedPokemon(null);
        setGridMode('view');
        setHighlightedCells({ movement: new Set(), attack: new Set() });
      }
    }
  }, [simulation, battleState, gridMode, selectedPokemon, highlightedCells, getOccupiedPositions]);

  // T021: Handle Escape key to cancel movement selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && gridMode !== 'view') {
        setSelectedPokemon(null);
        setGridMode('view');
        setHighlightedCells({ movement: new Set(), attack: new Set() });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gridMode]);

  // T042: Clear selection if selected Pokemon faints
  useEffect(() => {
    if (!selectedPokemon || !simulation) return;
    const combatant = simulation.combatant1?.combatant_id === selectedPokemon
      ? simulation.combatant1
      : simulation.combatant2;
    if (combatant && combatant.current_hp <= 0) {
      setSelectedPokemon(null);
      setGridMode('view');
      setHighlightedCells({ movement: new Set(), attack: new Set() });
    }
  }, [simulation, selectedPokemon]);

  // Feature 023: Handle move selection for range display (T023-T028)
  const handleMoveSelect = useCallback((move, combatant) => {
    if (!combatant?.position) return;

    // T024: Parse move range (feet to cells)
    let rangeCells = 1; // Default melee
    if (move.range) {
      const rangeStr = String(move.range).toLowerCase();
      if (rangeStr === 'melee' || rangeStr === '5') {
        rangeCells = 1;
      } else {
        const rangeFeet = parseInt(rangeStr) || 30;
        rangeCells = feetToCells(rangeFeet);
      }
    }

    // T025: Calculate cells in range
    const cellsInRange = getCellsInRange(combatant.position, rangeCells);
    const attackSet = new Set(cellsInRange.map(c => toGridNotation(c.col, c.row)));

    // Get opponent for valid targets
    const opponent = combatant.owner === 'player'
      ? simulation.combatant2
      : simulation.combatant1;

    const validTargets = [];
    if (opponent?.position && opponent.current_hp > 0) {
      const opponentNotation = toGridNotation(opponent.position.col, opponent.position.row);
      if (attackSet.has(opponentNotation)) {
        const distance = Math.abs(combatant.position.col - opponent.position.col) +
                        Math.abs(combatant.position.row - opponent.position.row);
        validTargets.push({
          combatant_id: opponent.combatant_id,
          name: opponent.name,
          position: opponent.position,
          distance
        });
      }
    }

    setSelectedMove(move);
    setGridMode('attack');
    setHighlightedCells(prev => ({ ...prev, attack: attackSet }));
    setRangeDisplayData({
      selectedMove: { ...move, range_cells: rangeCells },
      attackerPosition: combatant.position,
      validTargets,
      cellsInRange
    });
  }, [simulation]);

  // T028: Clear range highlighting
  const handleClearRange = useCallback(() => {
    setSelectedMove(null);
    setGridMode('view');
    setHighlightedCells(prev => ({ ...prev, attack: new Set() }));
    setRangeDisplayData(null);
  }, []);

  const handleCellHover = useCallback((col, row, notation) => {
    // Will be expanded for tooltips and previews
  }, []);

  const handleCellLeave = useCallback(() => {
    // Will be expanded for tooltips and previews
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Combat Test Harness</h1>
        <p style={styles.subtitle}>Debug and test the Pokemon 5e battle system</p>
      </header>

      <main style={styles.main}>
        {/* Left panel: Pokemon selectors and controls */}
        <div style={styles.leftPanel}>
          {/* Quick Battle Generator */}
          <div style={styles.quickBattle}>
            <h3 style={styles.quickBattleTitle}>Quick Battle</h3>
            <div style={styles.quickBattleRow}>
              <label style={styles.quickBattleLabel}>Level:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={quickBattleLevel}
                onChange={(e) => setQuickBattleLevel(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                disabled={isRunning}
                style={styles.quickBattleInput}
              />
              <label style={styles.quickBattleLabel}>SR:</label>
              <select
                value={quickBattleSR}
                onChange={(e) => setQuickBattleSR(e.target.value)}
                disabled={isRunning}
                style={styles.quickBattleSelect}
              >
                <option value="any">Any</option>
                <option value="0.125">0.125</option>
                <option value="0.25">0.25</option>
                <option value="0.5">0.5</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="13">13</option>
              </select>
              <button
                onClick={handleGenerateRandomBattle}
                disabled={isRunning || isGenerating || pokemonList.length < 2}
                style={styles.quickBattleButton}
              >
                {isGenerating ? 'Generating...' : 'Random Battle'}
              </button>
            </div>
          </div>

          <div style={styles.selectors}>
            <PokemonSelector
              label="Pokemon 1"
              pokemonList={pokemonList}
              selectedPokemon={pokemon1Id}
              selectedLevel={pokemon1Level}
              selectedMoves={pokemon1Moves}
              onPokemonChange={setPokemon1Id}
              onLevelChange={setPokemon1Level}
              onMovesChange={setPokemon1Moves}
              disabled={isRunning}
            />

            <div style={styles.vsContainer}>
              <span style={styles.vs}>VS</span>
            </div>

            <PokemonSelector
              label="Pokemon 2"
              pokemonList={pokemonList}
              selectedPokemon={pokemon2Id}
              selectedLevel={pokemon2Level}
              selectedMoves={pokemon2Moves}
              onPokemonChange={setPokemon2Id}
              onLevelChange={setPokemon2Level}
              onMovesChange={setPokemon2Moves}
              disabled={isRunning}
            />
          </div>

          {/* HP Display during battle */}
          {simulation && (
            <div style={styles.hpDisplay}>
              <div style={styles.hpBar}>
                <span style={styles.hpLabel}>{simulation.combatant1?.name || 'Pokemon 1'}</span>
                <div style={styles.hpBarOuter}>
                  <div
                    style={{
                      ...styles.hpBarInner,
                      width: `${Math.max(0, (simulation.combatant1?.current_hp / simulation.combatant1?.max_hp) * 100)}%`,
                      backgroundColor: getHpColor(simulation.combatant1?.current_hp / simulation.combatant1?.max_hp)
                    }}
                  />
                </div>
                <span style={styles.hpText}>
                  {simulation.combatant1?.current_hp}/{simulation.combatant1?.max_hp}
                </span>
              </div>

              <div style={styles.hpBar}>
                <span style={styles.hpLabel}>{simulation.combatant2?.name || 'Pokemon 2'}</span>
                <div style={styles.hpBarOuter}>
                  <div
                    style={{
                      ...styles.hpBarInner,
                      width: `${Math.max(0, (simulation.combatant2?.current_hp / simulation.combatant2?.max_hp) * 100)}%`,
                      backgroundColor: getHpColor(simulation.combatant2?.current_hp / simulation.combatant2?.max_hp)
                    }}
                  />
                </div>
                <span style={styles.hpText}>
                  {simulation.combatant2?.current_hp}/{simulation.combatant2?.max_hp}
                </span>
              </div>
            </div>
          )}

          {/* Feature 023: Movement Panel (T034) */}
          {simulation && (
            <MovementPanel
              selectedCombatant={getSelectedCombatant()}
              movementState={getMovementState()}
              validMoveTargets={highlightedCells.movement.size}
              onMoveClick={handleMovePanelClick}
              onCancelMove={handleCancelMovePanel}
              moveMode={gridMode === 'move'}
              disabled={battleState !== 'running' && battleState !== 'paused'}
            />
          )}

          {/* Feature 023: Move selection for range display (T023) */}
          {simulation && simulation.combatant1 && (
            <div style={styles.moveSelection}>
              <div style={styles.moveSelectionHeader}>
                <span>Moves (click to show range)</span>
                {selectedMove && (
                  <button
                    style={styles.clearRangeButton}
                    onClick={handleClearRange}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div style={styles.moveButtons}>
                {simulation.combatant1.known_moves?.map(move => (
                  <button
                    key={move.id}
                    style={{
                      ...styles.moveButton,
                      backgroundColor: selectedMove?.id === move.id ? '#f44336' : '#333'
                    }}
                    onClick={() => handleMoveSelect(move, simulation.combatant1)}
                  >
                    {move.name}
                  </button>
                ))}
              </div>

              {/* Range Indicator */}
              {rangeDisplayData && (
                <RangeIndicator
                  selectedMove={rangeDisplayData.selectedMove}
                  attackerPosition={rangeDisplayData.attackerPosition}
                  validTargets={rangeDisplayData.validTargets}
                  cellsInRange={rangeDisplayData.cellsInRange}
                  visible={true}
                  onTargetClick={(id) => { /* Future: Execute attack on target */ }}
                />
              )}
            </div>
          )}

          {/* Winner banner */}
          {winner && (
            <div style={{
              ...styles.winnerBanner,
              backgroundColor: winner === 'draw' ? '#FFC107' : '#4CAF50'
            }}>
              {getWinnerText()}
            </div>
          )}
        </div>

        {/* Center panel: Controls and Battle Grid */}
        <div style={styles.centerPanel}>
          <ControlPanel
            battleState={battleState}
            mode={mode}
            speed={speed}
            seed={displaySeed}
            onStart={handleStart}
            onNextTurn={handleNextTurn}
            onReset={handleReset}
            onModeChange={handleModeChange}
            onSpeedChange={handleSpeedChange}
            onSeedChange={handleSeedChange}
            onPause={handlePause}
            onResume={handleResume}
          />

          {/* Battle Grid (Feature 023) */}
          {simulation && (
            <>
              <h3 style={styles.gridTitle}>Battle Grid</h3>
              <BattleGrid
              cells={gridCells}
              combatants={{
                player: simulation.combatant1 ? [simulation.combatant1] : [],
                opponent: simulation.combatant2 ? [simulation.combatant2] : []
              }}
              highlightedCells={highlightedCells}
              selectedCombatantId={selectedPokemon}
              onCellClick={handleCellClick}
              onCellHover={handleCellHover}
              onCellLeave={handleCellLeave}
              showCoordinates={true}
              disabled={battleState !== 'running' && battleState !== 'paused'}
            />
            </>
          )}
        </div>

        {/* Right panel: Battle log */}
        <div style={styles.rightPanel}>
          <BattleLog
            entries={logEntries}
            autoScroll={true}
            maxHeight={600}
          />
        </div>
      </main>

      {/* Footer with seed info */}
      {displaySeed && (
        <footer style={styles.footer}>
          <span style={styles.seedInfo}>
            Seed: {displaySeed} | Use this seed to reproduce this battle
          </span>
        </footer>
      )}
    </div>
  );
}

function getHpColor(ratio) {
  if (ratio > 0.5) return '#4CAF50';
  if (ratio > 0.25) return '#FFC107';
  return '#f44336';
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    padding: '20px',
    textAlign: 'center',
    borderBottom: '1px solid #333'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#888'
  },
  main: {
    display: 'flex',
    gap: '24px',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '320px',
    flexShrink: 0
  },
  selectors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  quickBattle: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  quickBattleTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  quickBattleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  quickBattleLabel: {
    fontSize: '13px',
    color: '#aaa'
  },
  quickBattleInput: {
    width: '60px',
    padding: '6px 8px',
    fontSize: '14px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    textAlign: 'center'
  },
  quickBattleSelect: {
    width: '70px',
    padding: '6px 8px',
    fontSize: '14px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  quickBattleButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  vsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px'
  },
  vs: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#f44336'
  },
  centerPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  gridTitle: {
    margin: 0,
    fontSize: '16px',
    color: '#888',
    fontWeight: 'normal'
  },
  rightPanel: {
    flex: 1,
    minWidth: 0
  },
  hpDisplay: {
    padding: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px'
  },
  hpBar: {
    marginBottom: '12px'
  },
  hpLabel: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff'
  },
  hpBarOuter: {
    height: '20px',
    backgroundColor: '#333',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px'
  },
  hpBarInner: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.3s ease'
  },
  hpText: {
    fontSize: '12px',
    color: '#888'
  },
  winnerBanner: {
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#000'
  },
  moveSelection: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    marginTop: '8px'
  },
  moveSelectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '12px',
    color: '#888'
  },
  clearRangeButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #666',
    borderRadius: '4px',
    color: '#888',
    fontSize: '10px',
    cursor: 'pointer'
  },
  moveButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },
  moveButton: {
    padding: '6px 10px',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  footer: {
    padding: '12px 20px',
    textAlign: 'center',
    borderTop: '1px solid #333',
    backgroundColor: '#0d0d0d'
  },
  seedInfo: {
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace'
  }
};
