/**
 * MiniHPBar Component
 *
 * Compact HP bar for mini party display with spec thresholds:
 * - Green: >75%
 * - Yellow/Orange: 25-75%
 * - Red: <25%
 *
 * Feature: 011-game-layout
 */

import React from 'react';

export default function MiniHPBar({ current, max }) {
  // Calculate percentage, handle edge cases
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Determine color based on spec thresholds
  let colorClass = 'mini-hp-bar__fill--green';
  if (clampedPercentage === 0) {
    colorClass = 'mini-hp-bar__fill--fainted';
  } else if (clampedPercentage < 25) {
    colorClass = 'mini-hp-bar__fill--red';
  } else if (clampedPercentage <= 75) {
    colorClass = 'mini-hp-bar__fill--yellow';
  }

  return (
    <div className="mini-hp-bar">
      <div className="mini-hp-bar__track">
        <div
          className={`mini-hp-bar__fill ${colorClass}`}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`HP: ${current} out of ${max}`}
        />
      </div>

      <style jsx>{`
        .mini-hp-bar {
          width: 100%;
        }

        .mini-hp-bar__track {
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .mini-hp-bar__fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .mini-hp-bar__fill--green {
          background: #4ade80;
        }

        .mini-hp-bar__fill--yellow {
          background: #fbbf24;
        }

        .mini-hp-bar__fill--red {
          background: #f87171;
        }

        .mini-hp-bar__fill--fainted {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}
