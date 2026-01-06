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

  // Auto-run interval ref
  const autoRunRef = useRef(null);

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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Combat Test Harness</h1>
        <p style={styles.subtitle}>Debug and test the Pokemon 5e battle system</p>
      </header>

      <main style={styles.main}>
        {/* Left panel: Pokemon selectors and controls */}
        <div style={styles.leftPanel}>
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
