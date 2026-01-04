import React, { useState, useEffect } from 'react';
import StarterCard from './StarterCard';
import { apiFetch } from '../../lib/apiFetch';

/**
 * StarterGrid Component
 *
 * Fetches and displays a grid of starter-eligible Pokemon.
 * Handles selection state and passes selected Pokemon up to parent.
 *
 * Props:
 *   - onSelect: Function called when a Pokemon is selected
 *   - selectedPokemon: Currently selected Pokemon object (or null)
 *   - typeFilter: Array of type strings to filter by (optional, for US2)
 */
export default function StarterGrid({ onSelect, selectedPokemon, typeFilter = [] }) {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStarters();
  }, [typeFilter]);

  const fetchStarters = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = '/api/pokemon/starters';

      // Add type filter if provided
      if (typeFilter.length > 0) {
        url += `?types=${typeFilter.join(',')}`;
      }

      const response = await apiFetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load Pokemon');
      }

      setPokemon(data.data.pokemon);
    } catch (err) {
      console.error('Error fetching starters:', err);
      setError(err.message || 'Failed to load starter Pokemon');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (pkmn) => {
    if (onSelect) {
      onSelect(pkmn);
    }
  };

  if (loading) {
    return (
      <div className="starter-grid__loading">
        <div className="spinner"></div>
        <p>Loading starter Pokemon...</p>
        <style jsx>{`
          .starter-grid__loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #666;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e0e0e0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="starter-grid__error">
        <p>Error: {error}</p>
        <button onClick={fetchStarters}>Try Again</button>
        <style jsx>{`
          .starter-grid__error {
            text-align: center;
            padding: 40px 20px;
            color: #dc2626;
          }
          .starter-grid__error button {
            margin-top: 16px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
          .starter-grid__error button:hover {
            background: #2563eb;
          }
        `}</style>
      </div>
    );
  }

  if (pokemon.length === 0) {
    return (
      <div className="starter-grid__empty">
        <p>No starter Pokemon found matching your filters.</p>
        <style jsx>{`
          .starter-grid__empty {
            text-align: center;
            padding: 40px 20px;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="starter-grid">
      {pokemon.map((pkmn) => (
        <StarterCard
          key={pkmn.id}
          pokemon={pkmn}
          onClick={handleCardClick}
          selected={selectedPokemon?.id === pkmn.id}
        />
      ))}

      <style jsx>{`
        .starter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
          padding: 20px 0;
        }

        @media (min-width: 768px) {
          .starter-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
