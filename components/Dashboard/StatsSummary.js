import React from 'react';

/**
 * StatsSummary Component
 *
 * Displays player statistics in a horizontal bar:
 * - Box count (Pokemon in storage)
 * - Pokedex progress (distinct species caught)
 * - Badge count (gym badges earned)
 *
 * Props:
 *   - boxCount: Number of Pokemon in storage
 *   - pokedexCaught: Number of distinct species caught
 *   - badgeCount: Number of gym badges earned
 */
export default function StatsSummary({ boxCount, pokedexCaught, badgeCount }) {
  return (
    <div className="stats-summary">
      <div className="stats-summary__item">
        <span className="stats-summary__value">{boxCount}</span>
        <span className="stats-summary__label">In Box</span>
      </div>

      <div className="stats-summary__divider" />

      <div className="stats-summary__item">
        <span className="stats-summary__value">{pokedexCaught}</span>
        <span className="stats-summary__label">Pokedex</span>
      </div>

      <div className="stats-summary__divider" />

      <div className="stats-summary__item stats-summary__item--badges">
        <span className="stats-summary__value">
          {badgeCount === 0 ? (
            <span className="stats-summary__placeholder">-</span>
          ) : (
            badgeCount
          )}
        </span>
        <span className="stats-summary__label">Badges</span>
      </div>

      <style jsx>{`
        .stats-summary {
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          padding: 16px 32px;
          margin-bottom: 24px;
          gap: 24px;
        }

        .stats-summary__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .stats-summary__value {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          line-height: 1;
        }

        .stats-summary__label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .stats-summary__divider {
          width: 1px;
          height: 40px;
          background: #e0e0e0;
        }

        .stats-summary__placeholder {
          color: #ccc;
        }

        .stats-summary__item--badges .stats-summary__value {
          color: ${badgeCount === 0 ? '#ccc' : '#333'};
        }

        @media (max-width: 480px) {
          .stats-summary {
            padding: 12px 16px;
            gap: 16px;
          }

          .stats-summary__item {
            min-width: 60px;
          }

          .stats-summary__value {
            font-size: 24px;
          }

          .stats-summary__label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
