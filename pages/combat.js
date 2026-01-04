/**
 * Combat Arena Page
 *
 * Placeholder page for Pokemon battles.
 * Wrapped with GameLayout for consistent navigation.
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import GameLayout from '../components/layout/GameLayout';

function CombatContent() {
  return (
    <div className="combat-page">
      <h1>Combat Arena</h1>
      <p>Battle other trainers and wild Pokemon here.</p>
      <div className="placeholder-box">
        <span>Combat functionality coming soon...</span>
      </div>

      <style jsx>{`
        .combat-page {
          color: white;
        }

        .combat-page h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #fbbf24;
        }

        .combat-page p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 24px;
        }

        .placeholder-box {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default function CombatPage() {
  return (
    <GameLayout>
      <CombatContent />
    </GameLayout>
  );
}
