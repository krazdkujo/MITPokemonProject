import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StarterGrid from '../components/starter/StarterGrid';
import TypeFilterBar from '../components/starter/TypeFilterBar';
import ConfirmationModal from '../components/starter/ConfirmationModal';
import { apiFetch } from '../lib/apiFetch';

/**
 * Starter Selection Page
 *
 * Allows new users to browse and select their starter Pokemon.
 * Shows a grid of eligible starters with type filtering and a confirmation modal.
 */
export default function StarterSelect() {
  const router = useRouter();
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Check if user already has Pokemon - redirect to dashboard if so
  useEffect(() => {
    const checkPokemonStatus = async () => {
      try {
        const response = await apiFetch('/api/player/pokemon/check');
        const data = await response.json();
        if (data.success && data.data.has_pokemon) {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Error checking Pokemon status:', err);
      }
    };
    checkPokemonStatus();
  }, [router]);

  // Fetch available types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await apiFetch('/api/pokemon/starters');
        const data = await response.json();
        if (data.success && data.data.available_types) {
          setAvailableTypes(data.data.available_types);
        }
      } catch (err) {
        console.error('Error fetching types:', err);
      }
    };
    fetchTypes();
  }, []);

  const handlePokemonSelect = (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowModal(true);
    setError(null);
  };

  const handleTypeFilterChange = (types) => {
    setSelectedTypes(types);
    // Clear selection when filters change
    setSelectedPokemon(null);
  };

  const handleConfirm = async () => {
    if (!selectedPokemon) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch('/api/player/pokemon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pokemon_id: selectedPokemon.id,
          is_starter: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to select starter');
      }

      // Success! Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error selecting starter:', err);
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedPokemon(null);
    setError(null);
  };

  return (
    <div className="starter-select">
      <div className="container">
        <header className="header">
          <h1>Choose Your Starter Pokemon</h1>
          <p>Select your first Pokemon partner. Choose wisely - this decision is permanent!</p>
        </header>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {availableTypes.length > 0 && (
          <TypeFilterBar
            availableTypes={availableTypes}
            selectedTypes={selectedTypes}
            onChange={handleTypeFilterChange}
            maxSelection={2}
          />
        )}

        <StarterGrid
          onSelect={handlePokemonSelect}
          selectedPokemon={selectedPokemon}
          typeFilter={selectedTypes}
        />

        <ConfirmationModal
          pokemon={selectedPokemon}
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>

      <style jsx>{`
        .starter-select {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 40px 20px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .header h1 {
          color: #333;
          font-size: 32px;
          margin: 0 0 12px 0;
        }

        .header p {
          color: #666;
          font-size: 16px;
          margin: 0;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-banner p {
          margin: 0;
          color: #dc2626;
        }

        .error-banner button {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 24px;
          }

          .header p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
