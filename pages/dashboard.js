import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthGuard from '../components/layout/AuthGuard';
import { apiFetch } from '../lib/apiFetch';

/**
 * Dashboard Page
 *
 * Landing page after starter selection.
 * Shows welcome message and the user's starter Pokemon.
 * Protected by AuthGuard - requires authentication and at least one Pokemon.
 */
function DashboardContent() {
  const router = useRouter();
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayerPokemon();
  }, []);

  const fetchPlayerPokemon = async () => {
    try {
      const response = await apiFetch('/api/player/pokemon');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load Pokemon');
      }

      setPokemon(data.data.pokemon);
    } catch (err) {
      console.error('Error fetching player Pokemon:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your Pokemon...</p>
        </div>
        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loading {
            text-align: center;
            color: white;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
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
      <div className="dashboard">
        <div className="error-container">
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={() => router.push('/test-auth')}>
            Return to Login
          </button>
        </div>
        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .error-container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
          }
          .error-container h1 {
            color: #dc2626;
            margin-bottom: 16px;
          }
          .error-container button {
            margin-top: 20px;
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          }
        `}</style>
      </div>
    );
  }

  const starterPokemon = pokemon.find(p => p.slot_number === 1);

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome, Trainer!</h1>

        {starterPokemon && (
          <div className="starter-showcase">
            <h2>Your Starter Pokemon</h2>
            <div className="pokemon-card">
              {starterPokemon.artwork || starterPokemon.sprite ? (
                <img
                  src={starterPokemon.artwork || starterPokemon.sprite}
                  alt={starterPokemon.name}
                  className="pokemon-image"
                />
              ) : (
                <div className="pokemon-placeholder">?</div>
              )}
              <h3 className="pokemon-name">{starterPokemon.name}</h3>
              <div className="pokemon-types">
                {starterPokemon.type.map((type) => (
                  <span
                    key={type}
                    className={`type-badge type-badge--${type.toLowerCase()}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <p className="pokemon-level">Level {starterPokemon.level}</p>
            </div>
          </div>
        )}

        <div className="dashboard-message">
          <p>Your adventure begins now!</p>
          <p className="coming-soon">More features coming soon...</p>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
        }

        .dashboard-content {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        h1 {
          color: white;
          font-size: 36px;
          margin-bottom: 40px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .starter-showcase {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          margin-bottom: 32px;
        }

        .starter-showcase h2 {
          color: #333;
          margin: 0 0 24px 0;
          font-size: 20px;
        }

        .pokemon-card {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pokemon-image {
          width: 200px;
          height: 200px;
          object-fit: contain;
          margin-bottom: 16px;
        }

        .pokemon-placeholder {
          width: 200px;
          height: 200px;
          background: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          color: #999;
          margin-bottom: 16px;
        }

        .pokemon-name {
          margin: 0 0 12px 0;
          font-size: 32px;
          font-weight: 700;
          color: #333;
        }

        .pokemon-types {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .type-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: capitalize;
          color: white;
          background: #888;
        }

        .type-badge--normal { background: #A8A878; }
        .type-badge--fire { background: #F08030; }
        .type-badge--water { background: #6890F0; }
        .type-badge--electric { background: #F8D030; color: #333; }
        .type-badge--grass { background: #78C850; }
        .type-badge--ice { background: #98D8D8; color: #333; }
        .type-badge--fighting { background: #C03028; }
        .type-badge--poison { background: #A040A0; }
        .type-badge--ground { background: #E0C068; color: #333; }
        .type-badge--flying { background: #A890F0; }
        .type-badge--psychic { background: #F85888; }
        .type-badge--bug { background: #A8B820; }
        .type-badge--rock { background: #B8A038; }
        .type-badge--ghost { background: #705898; }
        .type-badge--dragon { background: #7038F8; }
        .type-badge--dark { background: #705848; }
        .type-badge--steel { background: #B8B8D0; color: #333; }
        .type-badge--fairy { background: #EE99AC; }

        .pokemon-level {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .dashboard-message {
          color: white;
        }

        .dashboard-message p {
          margin: 8px 0;
          font-size: 18px;
        }

        .coming-soon {
          opacity: 0.7;
          font-size: 14px !important;
        }
      `}</style>
    </div>
  );
}

/**
 * Dashboard wrapped with AuthGuard
 * Requires authentication and at least one Pokemon
 */
export default function Dashboard() {
  return (
    <AuthGuard requirePokemon={true}>
      <DashboardContent />
    </AuthGuard>
  );
}
