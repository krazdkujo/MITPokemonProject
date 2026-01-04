import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '../components/layout/AuthGuard';
import StatsCard from '../components/Stats/StatsCard';
import TypeDistributionChart from '../components/Stats/TypeDistributionChart';
import TopPokemonList from '../components/Stats/TopPokemonList';
import LevelDistributionChart from '../components/Stats/LevelDistributionChart';
import BattleStatsPlaceholder from '../components/Stats/BattleStatsPlaceholder';
import BadgeProgressPlaceholder from '../components/Stats/BadgeProgressPlaceholder';
import { apiFetch } from '../lib/apiFetch';

/**
 * Stats Page
 *
 * Displays comprehensive player statistics:
 * - Collection overview with type distribution
 * - Level statistics with top Pokemon and distribution
 * - Battle statistics (placeholder for future)
 * - Badge progression (placeholder for future)
 *
 * Protected by AuthGuard - requires authentication.
 */
function StatsContent() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/player/stats');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load statistics');
      }

      setStatsData(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="stats-page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading your statistics...</p>
        </div>

        <style jsx>{`
          .stats-page {
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

  // Error state
  if (error) {
    return (
      <div className="stats-page">
        <div className="error-container">
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={fetchStats}>
            Try Again
          </button>
          <Link href="/dashboard" className="back-link">
            Back to Dashboard
          </Link>
        </div>

        <style jsx>{`
          .stats-page {
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
          .error-container :global(.back-link) {
            display: block;
            margin-top: 16px;
            color: #6b7280;
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  const { collection, levels, battles, badges } = statsData || {};

  return (
    <div className="stats-page">
      <div className="stats-content">
        <header className="stats-header">
          <Link href="/dashboard" className="back-button">
            Back to Dashboard
          </Link>
          <h1>Your Statistics</h1>
          <p className="stats-subtitle">
            {collection?.totalPokemon || 0} Pokemon |{' '}
            {collection?.uniqueSpecies || 0} Unique Species
          </p>
        </header>

        <div className="stats-grid">
          {/* Collection Statistics - Type Distribution */}
          <StatsCard title="Type Distribution" className="type-card">
            <TypeDistributionChart
              data={collection?.typeDistribution}
              totalPokemon={collection?.totalPokemon}
            />
          </StatsCard>

          {/* Level Statistics - Top Pokemon */}
          <StatsCard title="Top Pokemon by Level" className="top-pokemon-card">
            <TopPokemonList pokemon={levels?.topPokemon} />
          </StatsCard>

          {/* Level Distribution */}
          <StatsCard title="Level Distribution" className="level-dist-card">
            <LevelDistributionChart distribution={levels?.distribution} />
          </StatsCard>

          {/* Battle Statistics Placeholder */}
          <StatsCard title="Battle Record" className="battle-card">
            <BattleStatsPlaceholder />
          </StatsCard>

          {/* Badge Progress Placeholder */}
          <StatsCard title="Gym Badges" className="badge-card">
            <BadgeProgressPlaceholder />
          </StatsCard>
        </div>
      </div>

      <style jsx>{`
        .stats-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
        }

        .stats-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .stats-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .stats-header :global(.back-button) {
          display: inline-block;
          margin-bottom: 16px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        .stats-header :global(.back-button:hover) {
          background: rgba(255, 255, 255, 0.3);
        }

        .stats-header h1 {
          color: white;
          font-size: 36px;
          margin: 0 0 8px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .stats-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-grid :global(.type-card) {
            grid-column: span 2;
          }
        }

        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .stats-grid :global(.type-card) {
            grid-column: span 2;
          }

          .stats-grid :global(.top-pokemon-card) {
            grid-column: span 1;
          }

          .stats-grid :global(.level-dist-card) {
            grid-column: span 2;
          }

          .stats-grid :global(.battle-card),
          .stats-grid :global(.badge-card) {
            grid-column: span 1;
          }
        }

        @media (max-width: 480px) {
          .stats-page {
            padding: 20px 12px;
          }

          .stats-header h1 {
            font-size: 28px;
          }

          .stats-subtitle {
            font-size: 15px;
          }

          .stats-grid {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Stats page wrapped with AuthGuard
 * Does not require Pokemon - users can view stats even with empty collection
 */
export default function Stats() {
  return (
    <AuthGuard requirePokemon={false}>
      <StatsContent />
    </AuthGuard>
  );
}
