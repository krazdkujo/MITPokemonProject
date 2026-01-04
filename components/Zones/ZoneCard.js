/**
 * ZoneCard Component
 *
 * Displays a single encounter zone with:
 * - Zone name
 * - Description
 * - Difficulty badge
 * - Terrain-based styling
 * - Pokemon count
 * - SR range
 *
 * Props:
 *   - zone: Object with id, name, description, terrain, difficulty, difficultyLabel, types, srRange, pokemonCount
 *   - isSelected: Boolean indicating if this zone is currently selected
 *   - onSelect: Callback function when zone is clicked
 *
 * Feature: 016-zone-encounters
 */

import React from 'react';
import DifficultyBadge from './DifficultyBadge';

// Terrain color configurations
const terrainColors = {
  water: { bg: 'rgba(104, 144, 240, 0.15)', border: 'rgba(104, 144, 240, 0.4)' },
  fire: { bg: 'rgba(240, 128, 48, 0.15)', border: 'rgba(240, 128, 48, 0.4)' },
  grass: { bg: 'rgba(120, 200, 80, 0.15)', border: 'rgba(120, 200, 80, 0.4)' },
  electric: { bg: 'rgba(248, 208, 48, 0.15)', border: 'rgba(248, 208, 48, 0.4)' },
  cave: { bg: 'rgba(112, 88, 72, 0.15)', border: 'rgba(112, 88, 72, 0.4)' },
  forest: { bg: 'rgba(34, 139, 34, 0.15)', border: 'rgba(34, 139, 34, 0.4)' },
  mountain: { bg: 'rgba(160, 160, 180, 0.15)', border: 'rgba(160, 160, 180, 0.4)' },
  urban: { bg: 'rgba(168, 168, 168, 0.15)', border: 'rgba(168, 168, 168, 0.4)' }
};

export default function ZoneCard({ zone, isSelected, onSelect }) {
  const terrain = terrainColors[zone.terrain] || terrainColors.grass;

  return (
    <div
      className={`zone-card ${isSelected ? 'zone-card--selected' : ''}`}
      onClick={() => onSelect(zone)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(zone);
        }
      }}
      data-terrain={zone.terrain}
    >
      <div className="zone-card__header">
        <h3 className="zone-card__name">{zone.name}</h3>
        <DifficultyBadge difficulty={zone.difficulty} label={zone.difficultyLabel} />
      </div>

      <p className="zone-card__description">{zone.description}</p>

      <div className="zone-card__info">
        <span className="zone-card__pokemon-count">
          {zone.pokemonCount} Pokemon
        </span>
        <span className="zone-card__types">
          {zone.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
        </span>
      </div>

      <style jsx>{`
        .zone-card {
          background: ${terrain.bg};
          border: 2px solid ${terrain.border};
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .zone-card:hover {
          transform: translateY(-2px);
          border-color: rgba(251, 191, 36, 0.6);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .zone-card:focus {
          outline: 2px solid #fbbf24;
          outline-offset: 2px;
        }

        .zone-card--selected {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.15);
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }

        .zone-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }

        .zone-card__name {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #fbbf24;
        }

        .zone-card__description {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }

        .zone-card__info {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .zone-card__pokemon-count {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          background: rgba(0, 0, 0, 0.2);
          padding: 4px 10px;
          border-radius: 4px;
        }

        .zone-card__types {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          padding: 4px 0;
        }
      `}</style>
    </div>
  );
}
