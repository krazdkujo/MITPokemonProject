/**
 * EncounterActions Component
 *
 * Displays action buttons for a wild Pokemon encounter:
 * - Battle button (primary action)
 * - Flee button (secondary action)
 *
 * Props:
 *   - onBattle: Callback function when Battle is clicked
 *   - onFlee: Callback function when Flee is clicked
 *   - disabled: Boolean to disable both buttons (e.g., during loading)
 *
 * Feature: 014-wild-encounter
 */

import React from 'react';

export default function EncounterActions({ onBattle, onFlee, disabled = false }) {
  return (
    <div className="encounter-actions">
      <button
        className="encounter-actions__button encounter-actions__button--battle"
        onClick={onBattle}
        disabled={disabled}
      >
        Battle
      </button>

      <button
        className="encounter-actions__button encounter-actions__button--flee"
        onClick={onFlee}
        disabled={disabled}
      >
        Flee
      </button>

      <style jsx>{`
        .encounter-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 24px;
        }

        .encounter-actions__button {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .encounter-actions__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .encounter-actions__button--battle {
          background: #fbbf24;
          color: #1a1a2e;
        }

        .encounter-actions__button--battle:hover:not(:disabled) {
          background: #f59e0b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }

        .encounter-actions__button--battle:active:not(:disabled) {
          transform: translateY(0);
        }

        .encounter-actions__button--flee {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .encounter-actions__button--flee:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .encounter-actions__button--flee:active:not(:disabled) {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .encounter-actions {
            flex-direction: column;
          }

          .encounter-actions__button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
