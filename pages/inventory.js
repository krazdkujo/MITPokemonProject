/**
 * Inventory Page
 *
 * Placeholder page for managing items.
 * Wrapped with GameLayout for consistent navigation.
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import GameLayout from '../components/layout/GameLayout';

function InventoryContent() {
  return (
    <div className="inventory-page">
      <h1>Inventory</h1>
      <p>Manage your items, Pokeballs, and equipment.</p>
      <div className="placeholder-box">
        <span>Inventory functionality coming soon...</span>
      </div>

      <style jsx>{`
        .inventory-page {
          color: white;
        }

        .inventory-page h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #fbbf24;
        }

        .inventory-page p {
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

export default function InventoryPage() {
  return (
    <GameLayout>
      <InventoryContent />
    </GameLayout>
  );
}
