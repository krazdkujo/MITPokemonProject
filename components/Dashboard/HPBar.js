import React from 'react';

/**
 * HPBar Component
 *
 * Displays a color-coded HP bar showing current vs max HP.
 * Colors change based on HP percentage:
 * - Green (>50%): Healthy
 * - Yellow (25-50%): Caution
 * - Red (<25%): Critical
 *
 * Props:
 *   - current: Current HP value
 *   - max: Maximum HP value
 */
export default function HPBar({ current, max }) {
  // Calculate percentage, handle edge cases
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Determine color class based on percentage
  let colorClass = 'hp-bar__fill--green';
  if (clampedPercentage <= 25) {
    colorClass = 'hp-bar__fill--red';
  } else if (clampedPercentage <= 50) {
    colorClass = 'hp-bar__fill--yellow';
  }

  return (
    <div className="hp-bar">
      <div className="hp-bar__track">
        <div
          className={`hp-bar__fill ${colorClass}`}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`HP: ${current} out of ${max}`}
        />
      </div>
      <span className="hp-bar__text">
        {current} / {max}
      </span>

      <style jsx>{`
        .hp-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .hp-bar__track {
          flex: 1;
          height: 12px;
          background: #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .hp-bar__fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .hp-bar__fill--green {
          background: #4ade80;
        }

        .hp-bar__fill--yellow {
          background: #facc15;
        }

        .hp-bar__fill--red {
          background: #f87171;
        }

        .hp-bar__text {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          min-width: 60px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
