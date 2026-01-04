/**
 * Zones Page
 *
 * Allows players to browse encounter zones organized by terrain type
 * and start type-appropriate encounters.
 *
 * Feature: 016-zone-encounters
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GameLayout from '../components/layout/GameLayout';
import TerrainGroup from '../components/Zones/TerrainGroup';
import { useGame } from '../lib/gameContext';
import { apiFetch } from '../lib/apiFetch';

// Error component for no party
function NoPartyError() {
  const router = useRouter();

  return (
    <div className="error-state">
      <h2>No Pokemon in Party</h2>
      <p>You need a Pokemon to explore encounter zones.</p>
      <button onClick={() => router.push('/starter')}>
        Choose Your Starter
      </button>

      <style jsx>{`
        .error-state {
          text-align: center;
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          max-width: 400px;
          margin: 0 auto;
        }

        .error-state h2 {
          color: #fbbf24;
          margin: 0 0 12px 0;
          font-size: 20px;
        }

        .error-state p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 20px 0;
        }

        .error-state button {
          background: #fbbf24;
          color: #1a1a2e;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .error-state button:hover {
          background: #f59e0b;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

// Error component for all fainted
function AllFaintedError() {
  const router = useRouter();

  return (
    <div className="error-state">
      <h2>All Pokemon Fainted</h2>
      <p>Your Pokemon need to be healed before you can explore zones.</p>
      <button onClick={() => router.push('/pokecenter')}>
        Go to Pokemon Center
      </button>

      <style jsx>{`
        .error-state {
          text-align: center;
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          max-width: 400px;
          margin: 0 auto;
        }

        .error-state h2 {
          color: #f87171;
          margin: 0 0 12px 0;
          font-size: 20px;
        }

        .error-state p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 20px 0;
        }

        .error-state button {
          background: #f87171;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .error-state button:hover {
          background: #ef4444;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

// Active battle notification
function ActiveBattleNotice({ battle, onResume }) {
  return (
    <div className="active-battle-notice">
      <div className="notice-content">
        <span className="material-icons">warning</span>
        <div className="notice-text">
          <strong>Active Battle in Progress</strong>
          <p>You have an ongoing battle in {battle.zone_name || 'a zone'}.</p>
        </div>
      </div>
      <button onClick={onResume}>Resume Battle</button>

      <style jsx>{`
        .active-battle-notice {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.4);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .notice-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notice-content .material-icons {
          font-size: 28px;
          color: #fbbf24;
        }

        .notice-text strong {
          display: block;
          color: #fbbf24;
          margin-bottom: 4px;
        }

        .notice-text p {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .active-battle-notice button {
          background: #fbbf24;
          color: #1a1a2e;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .active-battle-notice button:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
}

function ZonesContent() {
  const router = useRouter();
  const { party, loading: partyLoading, refreshParty } = useGame();

  // Zone data state
  const [zones, setZones] = useState([]);
  const [terrainGroups, setTerrainGroups] = useState({});
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // Active battle state
  const [activeBattle, setActiveBattle] = useState(null);
  const [checkingBattle, setCheckingBattle] = useState(true);

  // Encounter state
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  // Party validation
  const hasParty = party && party.length > 0;
  const hasHealthyPokemon = party && party.some(p => p.current_hp > 0);

  // Check for active battle on mount
  useEffect(() => {
    checkActiveBattle();
  }, []);

  // Load zones on mount
  useEffect(() => {
    loadZones();
  }, []);

  async function checkActiveBattle() {
    setCheckingBattle(true);
    try {
      const res = await apiFetch('/api/battle/active');
      const data = await res.json();

      if (data.success && data.data.has_active_battle) {
        setActiveBattle(data.data.battle);
      }
    } catch (err) {
      console.error('Failed to check active battle:', err);
    } finally {
      setCheckingBattle(false);
    }
  }

  async function loadZones() {
    setZonesLoading(true);
    setZonesError(null);

    try {
      const res = await apiFetch('/api/zones');
      const data = await res.json();

      if (data.success) {
        setZones(data.data.zones);
        setTerrainGroups(data.data.terrainGroups);
      } else {
        setZonesError(data.error?.message || 'Failed to load zones');
      }
    } catch (err) {
      console.error('Failed to load zones:', err);
      setZonesError('Failed to load zones. Please try again.');
    } finally {
      setZonesLoading(false);
    }
  }

  function handleSelectZone(zone) {
    setSelectedZone(zone);
    setStartError(null);
  }

  async function handleStartEncounter() {
    if (!selectedZone || !hasHealthyPokemon) return;

    // Block if active battle exists
    if (activeBattle) {
      router.push('/combat');
      return;
    }

    setIsStarting(true);
    setStartError(null);

    try {
      // Get party Pokemon IDs (healthy ones)
      const partyIds = party
        .filter(p => p.current_hp > 0)
        .map(p => p.id);

      const res = await apiFetch('/api/zones/encounter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: selectedZone.id,
          player_pokemon_ids: partyIds
        })
      });

      const data = await res.json();

      if (data.success) {
        // Navigate to combat with battle_id
        router.push(`/combat?battle_id=${data.data.battle_id}`);
      } else {
        if (data.error?.code === 'ACTIVE_BATTLE_EXISTS') {
          // Set active battle and show notice
          setActiveBattle(data.error.details);
          setStartError('You have an active battle. Resume or abandon it first.');
        } else {
          setStartError(data.error?.message || 'Failed to start encounter');
        }
      }
    } catch (err) {
      console.error('Start encounter error:', err);
      setStartError('Failed to start encounter. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }

  function handleResumeBattle() {
    if (activeBattle) {
      router.push(`/combat?battle_id=${activeBattle.battle_id}`);
    } else {
      router.push('/combat');
    }
  }

  // Show loading while party is loading
  if (partyLoading || checkingBattle) {
    return (
      <div className="zones-page">
        <h1>Encounter Zones</h1>
        <div className="loading-state">Loading...</div>

        <style jsx>{`
          .zones-page {
            color: white;
          }

          .zones-page h1 {
            font-size: 28px;
            margin-bottom: 8px;
            color: #fbbf24;
          }

          .loading-state {
            text-align: center;
            padding: 40px;
            color: rgba(255, 255, 255, 0.6);
          }
        `}</style>
      </div>
    );
  }

  // Show error if no party
  if (!hasParty) {
    return (
      <div className="zones-page">
        <h1>Encounter Zones</h1>
        <NoPartyError />

        <style jsx>{`
          .zones-page {
            color: white;
          }

          .zones-page h1 {
            font-size: 28px;
            margin-bottom: 24px;
            color: #fbbf24;
          }
        `}</style>
      </div>
    );
  }

  // Show error if all fainted
  if (hasParty && !hasHealthyPokemon) {
    return (
      <div className="zones-page">
        <h1>Encounter Zones</h1>
        <AllFaintedError />

        <style jsx>{`
          .zones-page {
            color: white;
          }

          .zones-page h1 {
            font-size: 28px;
            margin-bottom: 24px;
            color: #fbbf24;
          }
        `}</style>
      </div>
    );
  }

  // Get zones organized by terrain
  const terrainOrder = ['water', 'fire', 'grass', 'electric', 'cave', 'forest', 'mountain', 'urban'];
  const organizedTerrains = terrainOrder.filter(t => terrainGroups[t] && terrainGroups[t].length > 0);

  return (
    <div className="zones-page">
      <h1>Encounter Zones</h1>
      <p className="zones-page__intro">
        Explore different terrains to find type-specific Pokemon. Select a zone to start an encounter.
      </p>

      {activeBattle && (
        <ActiveBattleNotice battle={activeBattle} onResume={handleResumeBattle} />
      )}

      {zonesLoading && (
        <div className="loading-state">Loading zones...</div>
      )}

      {zonesError && (
        <div className="error-state">
          <p>{zonesError}</p>
          <button onClick={loadZones}>Retry</button>
        </div>
      )}

      {!zonesLoading && !zonesError && (
        <>
          {organizedTerrains.map(terrain => {
            const zoneIds = terrainGroups[terrain];
            const terrainZones = zones.filter(z => zoneIds.includes(z.id));

            return (
              <TerrainGroup
                key={terrain}
                terrain={terrain}
                zones={terrainZones}
                selectedZone={selectedZone}
                onSelectZone={handleSelectZone}
              />
            );
          })}

          {startError && (
            <div className="start-error">
              <p>{startError}</p>
            </div>
          )}

          <div className="start-section">
            <button
              className="start-button"
              onClick={handleStartEncounter}
              disabled={!selectedZone || isStarting || !!activeBattle}
            >
              {isStarting ? 'Starting Encounter...' : (
                activeBattle ? 'Resume Active Battle' :
                selectedZone ? `Enter ${selectedZone.name}` : 'Select a Zone'
              )}
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .zones-page {
          color: white;
        }

        .zones-page h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #fbbf24;
        }

        .zones-page__intro {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 24px;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.6);
        }

        .error-state {
          text-align: center;
          padding: 24px;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 8px;
        }

        .error-state p {
          color: #f87171;
          margin: 0 0 12px 0;
        }

        .error-state button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .start-error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          text-align: center;
        }

        .start-error p {
          color: #f87171;
          margin: 0;
        }

        .start-section {
          margin-top: 32px;
          text-align: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          position: sticky;
          bottom: 16px;
        }

        .start-button {
          background: #fbbf24;
          color: #1a1a2e;
          border: none;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 200px;
        }

        .start-button:hover:not(:disabled) {
          background: #f59e0b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }

        .start-button:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}

export default function ZonesPage() {
  return (
    <GameLayout>
      <ZonesContent />
    </GameLayout>
  );
}
