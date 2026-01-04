import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthGuard from '../components/layout/AuthGuard';
import PartyRoster from '../components/Dashboard/PartyRoster';
import StatsSummary from '../components/Dashboard/StatsSummary';
import { apiFetch } from '../lib/apiFetch';

/**
 * Dashboard Page
 *
 * Main player dashboard showing:
 * - Active party (up to 6 Pokemon with HP bars)
 * - Stats summary (box count, Pokedex progress, badges)
 * - Navigation to detailed stats page
 *
 * Protected by AuthGuard - requires authentication and at least one Pokemon.
 */
function DashboardContent() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiFetch('/api/player/pokemon');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load dashboard data');
      }

      setDashboardData(data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state with spinner
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

  // Error state
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

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome, Trainer!</h1>

        <StatsSummary
          boxCount={dashboardData?.box_count || 0}
          pokedexCaught={dashboardData?.pokedex_caught || 0}
          badgeCount={dashboardData?.badge_count || 0}
        />

        <PartyRoster pokemon={dashboardData?.pokemon || []} />

        <div className="dashboard-actions">
          <Link href="/stats" className="stats-link">
            View Detailed Stats
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
        }

        .dashboard-content {
          max-width: 1000px;
          margin: 0 auto;
        }

        h1 {
          color: white;
          font-size: 36px;
          margin-bottom: 32px;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .dashboard-actions {
          margin-top: 24px;
          text-align: center;
        }

        .dashboard-actions :global(.stats-link) {
          display: inline-block;
          padding: 14px 28px;
          background: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .dashboard-actions :global(.stats-link:hover) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
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
