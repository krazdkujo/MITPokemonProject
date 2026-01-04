/**
 * MiniPartyDisplay Component
 *
 * Shows up to 6 Pokemon in compact cards in the sidebar.
 * Handles empty party state with message.
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import { useGame } from '../../lib/gameContext';
import MiniPartyCard from './MiniPartyCard';

export default function MiniPartyDisplay() {
  const { party } = useGame();

  // Empty party state
  if (!party || party.length === 0) {
    return (
      <div className="mini-party-display mini-party-display--empty">
        <p>No Pokemon in your party.</p>
        <p className="mini-party-display__hint">Select a starter to begin!</p>

        <style jsx>{`
          .mini-party-display--empty {
            text-align: center;
            padding: 16px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
          }
          .mini-party-display__hint {
            color: rgba(251, 191, 36, 0.7);
            margin-top: 4px;
          }
        `}</style>
      </div>
    );
  }

  // Sort by slot number
  const sortedParty = [...party].sort((a, b) => a.slot_number - b.slot_number);

  return (
    <div className="mini-party-display">
      {sortedParty.map((pokemon) => (
        <MiniPartyCard key={pokemon.id} pokemon={pokemon} />
      ))}

      <style jsx>{`
        .mini-party-display {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
