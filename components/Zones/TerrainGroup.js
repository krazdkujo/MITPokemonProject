/**
 * TerrainGroup Component
 *
 * Displays a group of zones organized by terrain type.
 *
 * Props:
 *   - terrain: String (terrain type key, e.g., "water")
 *   - zones: Array of zone objects for this terrain
 *   - selectedZone: Currently selected zone object (or null)
 *   - onSelectZone: Callback when a zone is selected
 *
 * Feature: 016-zone-encounters
 */

import React from 'react';
import ZoneCard from './ZoneCard';

// Terrain display names and icons
const terrainInfo = {
  water: { name: 'Water', icon: 'water_drop' },
  fire: { name: 'Fire', icon: 'local_fire_department' },
  grass: { name: 'Grass', icon: 'grass' },
  electric: { name: 'Electric', icon: 'bolt' },
  cave: { name: 'Cave', icon: 'landscape' },
  forest: { name: 'Forest', icon: 'park' },
  mountain: { name: 'Mountain', icon: 'terrain' },
  urban: { name: 'Urban', icon: 'location_city' }
};

export default function TerrainGroup({ terrain, zones, selectedZone, onSelectZone }) {
  const info = terrainInfo[terrain] || { name: terrain, icon: 'place' };

  // Sort zones by difficulty
  const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 };
  const sortedZones = [...zones].sort((a, b) => {
    return (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
  });

  return (
    <div className="terrain-group" data-terrain={terrain}>
      <h2 className="terrain-group__title">
        <span className="material-icons terrain-group__icon">{info.icon}</span>
        {info.name} Zones
      </h2>

      <div className="terrain-group__grid">
        {sortedZones.map(zone => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            isSelected={selectedZone?.id === zone.id}
            onSelect={onSelectZone}
          />
        ))}
      </div>

      <style jsx>{`
        .terrain-group {
          margin-bottom: 32px;
        }

        .terrain-group__title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 20px;
          font-weight: 600;
          color: #fbbf24;
        }

        .terrain-group__icon {
          font-size: 24px;
        }

        .terrain-group__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
      `}</style>
    </div>
  );
}
