/**
 * Dashboard Page
 *
 * Main player dashboard showing:
 * - Active party (up to 6 Pokemon with HP bars)
 * - Stats summary (box count, Pokedex progress, badges)
 * - Navigation to detailed stats page
 *
 * Now wrapped with GameLayout for consistent navigation.
 *
 * Feature: 011-game-layout (updated)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import GameLayout from '../components/layout/GameLayout';
import PartyRoster from '../components/Dashboard/PartyRoster';
import StatsSummary from '../components/Dashboard/StatsSummary';
import { apiFetch } from '../lib/apiFetch';

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
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your Pokemon...</p>
        <style jsx>{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: white;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: #fbbf24;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
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
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData}>Try Again</button>
        <style jsx>{`
          .dashboard-error {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
            margin: 0 auto;
            color: white;
          }
          .dashboard-error h2 {
            color: #f87171;
            margin-bottom: 16px;
          }
          .dashboard-error button {
            margin-top: 20px;
            padding: 12px 24px;
            background: #fbbf24;
            color: #1a1a2e;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
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

      <style jsx>{`
        .dashboard {
          max-width: 1000px;
          margin: 0 auto;
        }

        h1 {
          color: white;
          font-size: 32px;
          margin-bottom: 24px;
        }

        .dashboard-actions {
          margin-top: 24px;
        }

        .dashboard-actions :global(.stats-link) {
          display: inline-block;
          padding: 12px 24px;
          background: rgba(255,255,255,0.1);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .dashboard-actions :global(.stats-link:hover) {
          background: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

/**
 * Dashboard wrapped with GameLayout
 * GameLayout handles AuthGuard and provides navigation
 */
export default function Dashboard() {
  return (
    <GameLayout>
      <DashboardContent />
    </GameLayout>
  );
}
