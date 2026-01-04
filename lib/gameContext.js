/**
 * GameContext - Layout-level state management for game data
 *
 * Provides player data (currency, party Pokemon) to all game pages
 * via React Context. Fetches data once at layout mount and shares
 * across child pages.
 *
 * Feature: 011-game-layout
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './authContext';
import { apiFetch } from './apiFetch';

const GameContext = createContext({
  // Player info
  playerName: '',
  currency: 0,

  // Party Pokemon (active only, max 6)
  party: [],

  // Loading/error states
  loading: true,
  error: null,

  // Actions
  refreshData: async () => {},
});

/**
 * GameProvider Component
 *
 * Wraps game pages to provide shared player data context.
 * Fetches currency and party data on mount and provides
 * refreshData() for child pages to trigger updates.
 */
export function GameProvider({ children }) {
  const { user } = useAuth();

  const [playerName, setPlayerName] = useState('');
  const [currency, setCurrency] = useState(0);
  const [party, setParty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all player data (currency and party)
   * Called on mount and when refreshData() is invoked
   */
  const fetchPlayerData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch both endpoints in parallel
      const [pokemonRes, inventoryRes] = await Promise.all([
        apiFetch('/api/player/pokemon'),
        apiFetch('/api/player/inventory'),
      ]);

      const pokemonData = await pokemonRes.json();
      const inventoryData = await inventoryRes.json();

      // Handle Pokemon response
      if (pokemonData.success) {
        // Filter for active party Pokemon only (up to 6)
        const activePokemon = (pokemonData.data.pokemon || [])
          .filter(p => p.is_active)
          .slice(0, 6)
          .map(p => ({
            id: p.id,
            pokemon_id: p.pokemon_id,
            name: p.name,
            level: p.level,
            current_hp: p.current_hp,
            max_hp: p.max_hp,
            slot_number: p.slot_number,
            sprite_url: `/images/pokemon/${p.pokemon_id}.png`,
            is_fainted: p.current_hp === 0,
            hp_percentage: p.max_hp > 0 ? Math.round((p.current_hp / p.max_hp) * 100) : 0,
          }));
        setParty(activePokemon);
      } else {
        console.error('Failed to fetch Pokemon:', pokemonData.error);
      }

      // Handle Inventory response (for currency)
      if (inventoryData.success) {
        setCurrency(inventoryData.data.currency || 0);
      } else {
        console.error('Failed to fetch inventory:', inventoryData.error);
      }

      // Set player name from auth user
      if (user?.user_metadata?.name) {
        setPlayerName(user.user_metadata.name);
      } else if (user?.email) {
        // Fallback to email prefix
        setPlayerName(user.email.split('@')[0]);
      }

    } catch (err) {
      console.error('Error fetching player data:', err);
      setError(err.message || 'Failed to load player data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch data on mount and when user changes
  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  /**
   * Refresh player data
   * Called by child pages after actions (purchase, heal, battle)
   */
  const refreshData = useCallback(async () => {
    await fetchPlayerData();
  }, [fetchPlayerData]);

  const value = {
    playerName,
    currency,
    party,
    loading,
    error,
    refreshData,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * useGame Hook
 *
 * Access game context from any child component.
 * Must be used within a GameProvider.
 */
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export default GameContext;
