import React from 'react';

/**
 * BattleStatsPlaceholder Component
 *
 * Displays a placeholder for battle statistics.
 * Battle tracking requires database tables not yet implemented.
 */
export default function BattleStatsPlaceholder() {
  return (
    <div className="battle-stats-placeholder">
      <div className="placeholder-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h4 className="placeholder-title">Battle Statistics</h4>
      <p className="placeholder-message">Coming Soon</p>
      <p className="placeholder-description">
        Track your wins, losses, and most-used Pokemon once the battle system is implemented.
      </p>

      <style jsx>{`
        .battle-stats-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 12px;
          opacity: 0.85;
        }

        .placeholder-icon {
          color: #d97706;
          margin-bottom: 12px;
        }

        .placeholder-title {
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 8px 0;
        }

        .placeholder-message {
          font-size: 14px;
          font-weight: 700;
          color: #b45309;
          margin: 0 0 12px 0;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
        }

        .placeholder-description {
          font-size: 13px;
          color: #78350f;
          margin: 0;
          max-width: 280px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
