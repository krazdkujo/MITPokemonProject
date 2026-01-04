/**
 * Wild Pokemon Page
 *
 * Placeholder page for encountering wild Pokemon.
 * Wrapped with GameLayout for consistent navigation.
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import GameLayout from '../components/layout/GameLayout';

function WildContent() {
  return (
    <div className="wild-page">
      <h1>Wild Pokemon</h1>
      <p>Explore the wilderness and encounter wild Pokemon.</p>
      <div className="placeholder-box">
        <span>Wild encounter functionality coming soon...</span>
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

        .wild-page p {
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

export default function WildPage() {
  return (
    <GameLayout>
      <WildContent />
    </GameLayout>
  );
}
