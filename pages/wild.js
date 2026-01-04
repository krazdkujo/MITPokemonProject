/**
 * Wild Pokemon Page
 *
 * Allows players to browse encounter locations, search for wild Pokemon,
 * and choose to battle or flee.
 *
 * Feature: 014-wild-encounter
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GameLayout from '../components/layout/GameLayout';
import LocationSelector from '../components/Wild/LocationSelector';
import EncounterDisplay from '../components/Wild/EncounterDisplay';
import EncounterActions from '../components/Wild/EncounterActions';
import { useGame } from '../lib/gameContext';
import { apiFetch } from '../lib/apiFetch';

// Map pokemon ID to national dex number for sprite paths
const pokemonNumbers = {
  'bulbasaur': 1, 'ivysaur': 2, 'venusaur': 3,
  'charmander': 4, 'charmeleon': 5, 'charizard': 6,
  'squirtle': 7, 'wartortle': 8, 'blastoise': 9,
  'caterpie': 10, 'metapod': 11, 'butterfree': 12,
  'weedle': 13, 'kakuna': 14, 'beedrill': 15,
  'pidgey': 16, 'pidgeotto': 17, 'pidgeot': 18,
  'rattata': 19, 'raticate': 20,
  'spearow': 21, 'fearow': 22,
  'pikachu': 25, 'raichu': 26,
  'nidoran-f': 29, 'nidorina': 30, 'nidoqueen': 31,
  'nidoran-m': 32, 'nidorino': 33, 'nidoking': 34,
  'clefairy': 35, 'clefable': 36,
  'jigglypuff': 39, 'wigglytuff': 40,
  'zubat': 41, 'golbat': 42,
  'oddish': 43, 'gloom': 44, 'vileplume': 45,
  'paras': 46, 'parasect': 47,
  'venomoth': 49,
  'primeape': 57,
  'bellsprout': 69, 'weepinbell': 70, 'victreebel': 71,
  'geodude': 74, 'graveler': 75, 'golem': 76,
  'haunter': 93, 'gengar': 94,
  'onix': 95,
};

// Client-side functions for encounter generation
function selectRandomPokemon(location) {
  if (!location || !location.pokemon || location.pokemon.length === 0) {
    return null;
  }

  const totalWeight = location.pokemon.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of location.pokemon) {
    random -= entry.weight;
    if (random <= 0) {
      return entry; // Return full entry including SR
    }
  }

  return location.pokemon[0];
}

// Calculate level based on SR (Species Rating)
// SR roughly maps to appropriate encounter level in Pokemon 5e
function generateLevelFromSR(sr) {
  if (sr <= 0.125) return Math.floor(Math.random() * 2) + 1; // 1-2
  if (sr <= 0.25) return Math.floor(Math.random() * 2) + 2;  // 2-3
  if (sr <= 0.5) return Math.floor(Math.random() * 2) + 3;   // 3-4
  if (sr <= 1) return Math.floor(Math.random() * 2) + 4;     // 4-5
  if (sr <= 2) return Math.floor(Math.random() * 2) + 5;     // 5-6
  if (sr <= 3) return Math.floor(Math.random() * 2) + 6;     // 6-7
  if (sr <= 4) return Math.floor(Math.random() * 2) + 7;     // 7-8
  if (sr <= 5) return Math.floor(Math.random() * 2) + 8;     // 8-9
  if (sr <= 6) return Math.floor(Math.random() * 2) + 9;     // 9-10
  if (sr <= 7) return Math.floor(Math.random() * 2) + 10;    // 10-11
  if (sr <= 8) return Math.floor(Math.random() * 2) + 11;    // 11-12
  if (sr <= 10) return Math.floor(Math.random() * 2) + 13;   // 13-14
  if (sr <= 13) return Math.floor(Math.random() * 3) + 15;   // 15-17
  return Math.floor(Math.random() * 3) + 18;                 // 18-20
}

// Error component for no party
function NoPartyError() {
  const router = useRouter();

  return (
    <div className="error-state">
      <h2>No Pokemon in Party</h2>
      <p>You need a Pokemon to search for wild encounters.</p>
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
      <p>Your Pokemon need to be healed before you can search for wild encounters.</p>
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

function WildContent() {
  const router = useRouter();
  const { party, loading: partyLoading } = useGame();

  // Location state
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Encounter state
  const [encounter, setEncounter] = useState(null);
  const [battleData, setBattleData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Party validation
  const hasParty = party && party.length > 0;
  const hasHealthyPokemon = party && party.some(p => p.current_hp > 0);

  // Load locations on mount
  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setLocationsLoading(true);
    setLocationsError(null);

    try {
      const res = await fetch('/api/locations');
      const data = await res.json();

      if (data.success) {
        setLocations(data.data.locations);
      } else {
        setLocationsError(data.error?.message || 'Failed to load locations');
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
      setLocationsError('Failed to load locations. Please try again.');
    } finally {
      setLocationsLoading(false);
    }
  }

  function handleSelectLocation(location) {
    setSelectedLocation(location);
    // Clear any previous encounter when selecting new location
    setEncounter(null);
    setBattleData(null);
    setSearchError(null);
  }

  async function handleSearch() {
    if (!selectedLocation || !hasHealthyPokemon) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Generate random Pokemon and level from location using SR-based scaling
      const wildPokemonEntry = selectRandomPokemon(selectedLocation);
      if (!wildPokemonEntry) {
        setSearchError('No Pokemon found in this location');
        return;
      }
      const wildLevel = generateLevelFromSR(wildPokemonEntry.sr || 1);

      // Get first healthy Pokemon from party
      const playerPokemon = party.find(p => p.current_hp > 0);

      if (!playerPokemon) {
        setSearchError('No healthy Pokemon available');
        return;
      }

      // Call battle/start API
      const res = await apiFetch('/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_pokemon_id: playerPokemon.id,
          opponent_pokemon_id: wildPokemonEntry.id,
          opponent_level: wildLevel,
          battle_type: 'wild'
        })
      });

      const data = await res.json();

      if (data.success) {
        setEncounter(data.data.opponent);
        setBattleData(data.data);
      } else {
        setSearchError(data.error?.message || 'Failed to generate encounter');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to search for Pokemon. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleBattle() {
    if (!battleData) return;

    router.push({
      pathname: '/combat',
      query: { battle_id: battleData.battle_id }
    });
  }

  function handleFlee() {
    setEncounter(null);
    setBattleData(null);
    setSearchError(null);
  }

  // Show loading while party is loading
  if (partyLoading) {
    return (
      <div className="wild-page">
        <h1>Wild Pokemon</h1>
        <div className="loading-state">Loading...</div>

        <style jsx>{`
          .wild-page {
            color: white;
          }

          .wild-page h1 {
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
      <div className="wild-page">
        <h1>Wild Pokemon</h1>
        <NoPartyError />

        <style jsx>{`
          .wild-page {
            color: white;
          }

          .wild-page h1 {
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
      <div className="wild-page">
        <h1>Wild Pokemon</h1>
        <AllFaintedError />

        <style jsx>{`
          .wild-page {
            color: white;
          }

          .wild-page h1 {
            font-size: 28px;
            margin-bottom: 24px;
            color: #fbbf24;
          }
        `}</style>
      </div>
    );
  }

  // Show encounter if active
  if (encounter) {
    const pokemonNumber = pokemonNumbers[encounter.pokemon_id] || null;

    return (
      <div className="wild-page">
        <h1>Wild Pokemon</h1>

        <EncounterDisplay
          pokemon={encounter}
          pokemonNumber={pokemonNumber}
        />

        <EncounterActions
          onBattle={handleBattle}
          onFlee={handleFlee}
        />

        <style jsx>{`
          .wild-page {
            color: white;
          }

          .wild-page h1 {
            font-size: 28px;
            margin-bottom: 24px;
            color: #fbbf24;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  // Show location selection
  return (
    <div className="wild-page">
      <h1>Wild Pokemon</h1>
      <p className="wild-page__intro">Explore the wilderness and encounter wild Pokemon.</p>

      <LocationSelector
        locations={locations}
        selectedLocation={selectedLocation}
        onSelectLocation={handleSelectLocation}
        loading={locationsLoading}
        error={locationsError}
        onRetry={loadLocations}
      />

      {searchError && (
        <div className="search-error">
          <p>{searchError}</p>
          <button onClick={handleSearch}>Retry</button>
        </div>
      )}

      <div className="search-section">
        <button
          className="search-button"
          onClick={handleSearch}
          disabled={!selectedLocation || isSearching}
        >
          {isSearching ? 'Searching...' : 'Search for Pokemon'}
        </button>
      </div>

      <style jsx>{`
        .wild-page {
          color: white;
        }

        .wild-page h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #fbbf24;
        }

        .wild-page__intro {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 24px;
        }

        .search-section {
          margin-top: 24px;
          text-align: center;
        }

        .search-button {
          background: #fbbf24;
          color: #1a1a2e;
          border: none;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-button:hover:not(:disabled) {
          background: #f59e0b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }

        .search-button:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .search-error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          text-align: center;
        }

        .search-error p {
          color: #f87171;
          margin: 0 0 12px 0;
        }

        .search-error button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .search-error button:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}

export default function WildPage() {
  return (
    <GameLayout>
      <WildContent />
    </GameLayout>
  );
}
