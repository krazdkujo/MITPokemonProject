/**
 * DifficultyBadge Component
 *
 * Displays a color-coded difficulty indicator for zones.
 *
 * Props:
 *   - difficulty: String (easy, medium, hard, expert)
 *   - label: String (display label, e.g., "Easy")
 *
 * Feature: 016-zone-encounters
 */

import React from 'react';

// Difficulty color configurations
const difficultyColors = {
  easy: { bg: 'rgba(72, 187, 120, 0.2)', border: 'rgba(72, 187, 120, 0.5)', text: '#48bb78' },
  medium: { bg: 'rgba(236, 201, 75, 0.2)', border: 'rgba(236, 201, 75, 0.5)', text: '#ecc94b' },
  hard: { bg: 'rgba(237, 137, 54, 0.2)', border: 'rgba(237, 137, 54, 0.5)', text: '#ed8936' },
  expert: { bg: 'rgba(245, 101, 101, 0.2)', border: 'rgba(245, 101, 101, 0.5)', text: '#f56565' }
};

export default function DifficultyBadge({ difficulty, label }) {
  const colors = difficultyColors[difficulty] || difficultyColors.medium;
  const displayLabel = label || difficulty;

  return (
    <span className="difficulty-badge">
      {displayLabel}
      <style jsx>{`
        .difficulty-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: ${colors.text};
          background: ${colors.bg};
          border: 1px solid ${colors.border};
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: capitalize;
        }
      `}</style>
    </span>
  );
}
