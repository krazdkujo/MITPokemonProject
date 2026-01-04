/**
 * GameLayout Component
 *
 * Main layout wrapper for all game pages. Provides:
 * - Top navigation bar (logo, currency, player info)
 * - Left sidebar (navigation links, mini party display)
 * - Main content area for page-specific content
 *
 * Wraps content with AuthGuard and GameProvider.
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import AuthGuard from './AuthGuard';
import { GameProvider, useGame } from '../../lib/gameContext';
import TopNav from './TopNav';
import SideNav from './SideNav';

/**
 * Inner layout component that has access to GameContext
 */
function GameLayoutInner({ children }) {
  const { loading, error, refreshData } = useGame();

  // Loading state
  if (loading) {
    return (
      <div className="game-layout game-layout--loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading game data...</p>
        </div>
        <style jsx>{`
          .game-layout--loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          }
          .loading-container {
            text-align: center;
            color: white;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.2);
            border-top-color: #fbbf24;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
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
      <div className="game-layout game-layout--error">
        <div className="error-container">
          <h2>Unable to Load Game Data</h2>
          <p>{error}</p>
          <button onClick={refreshData}>Try Again</button>
        </div>
        <style jsx>{`
          .game-layout--error {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          }
          .error-container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            color: white;
            max-width: 400px;
          }
          .error-container h2 {
            color: #f87171;
            margin-bottom: 16px;
          }
          .error-container p {
            margin-bottom: 24px;
            color: rgba(255,255,255,0.8);
          }
          .error-container button {
            padding: 12px 32px;
            background: #fbbf24;
            color: #1a1a2e;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, background 0.2s;
          }
          .error-container button:hover {
            background: #f59e0b;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }

  // Normal layout
  return (
    <div className="game-layout">
      <TopNav />
      <div className="game-layout__body">
        <SideNav />
        <main className="game-layout__main">
          {children}
        </main>
      </div>

      <style jsx>{`
        .game-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .game-layout__body {
          display: flex;
          flex: 1;
        }

        .game-layout__main {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

/**
 * GameLayout - Main export
 *
 * Wraps children with AuthGuard (requires Pokemon) and GameProvider.
 */
export default function GameLayout({ children }) {
  return (
    <AuthGuard requirePokemon={true}>
      <GameProvider>
        <GameLayoutInner>
          {children}
        </GameLayoutInner>
      </GameProvider>
    </AuthGuard>
  );
}
