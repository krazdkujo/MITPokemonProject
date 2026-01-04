import React from 'react';
import PartyCard from './PartyCard';

/**
 * PartyRoster Component
 *
 * Displays the player's active party (up to 6 Pokemon) in a grid layout.
 * Pokemon are ordered by slot_number (1-6).
 * Shows empty state message when no active Pokemon.
 *
 * Props:
 *   - pokemon: Array of Pokemon objects (will filter for is_active = true)
 */
export default function PartyRoster({ pokemon }) {
  // Filter for active Pokemon and sort by slot number
  const activePokemon = (pokemon || [])
    .filter(p => p.is_active)
    .sort((a, b) => (a.slot_number || 0) - (b.slot_number || 0));

  if (activePokemon.length === 0) {
    return (
      <div className="party-roster party-roster--empty">
        <div className="party-roster__empty-state">
          <p>No active Pokemon in your party.</p>
          <p className="party-roster__hint">Select a starter to begin your adventure!</p>
        </div>

        <style jsx>{`
          .party-roster--empty {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            padding: 40px;
            text-align: center;
          }

          .party-roster__empty-state p {
            margin: 8px 0;
            color: #666;
          }

          .party-roster__hint {
            font-size: 14px;
            opacity: 0.7;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="party-roster">
      <h2 className="party-roster__title">Your Party</h2>
      <div className="party-roster__grid">
        {activePokemon.map((p) => (
          <PartyCard key={p.id} pokemon={p} />
        ))}
      </div>

      <style jsx>{`
        .party-roster {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          padding: 24px;
        }

        .party-roster__title {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #333;
          text-align: center;
        }

        .party-roster__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .party-roster__grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .party-roster__grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
