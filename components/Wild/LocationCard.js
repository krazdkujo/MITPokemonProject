/**
 * LocationCard Component
 *
 * Displays a single encounter location with:
 * - Location name
 * - Description
 * - Pokemon preview images (first 3)
 * - Level range
 * - Terrain-based styling
 *
 * Props:
 *   - location: Object with id, name, description, levelRange, pokemon, terrain
 *   - isSelected: Boolean indicating if this location is currently selected
 *   - onSelect: Callback function when location is clicked
 *
 * Feature: 014-wild-encounter
 */

import React from 'react';

// Map pokemon ID to national dex number for sprite paths
const pokemonNumbers = {
  'rattata': 19,
  'pidgey': 16,
  'caterpie': 10,
  'weedle': 13,
  'pikachu': 25,
  'metapod': 11,
  'kakuna': 14,
  'spearow': 21,
  'nidoran-m': 32,
  'nidoran-f': 29,
  'zubat': 41,
  'geodude': 74,
  'clefairy': 35,
  'paras': 46,
  'oddish': 43,
  'bellsprout': 69,
  'jigglypuff': 39,
  'pidgeotto': 17,
  'nidorina': 30,
  'nidorino': 33,
  'gloom': 44,
  'haunter': 93,
  'butterfree': 12,
  'golbat': 42,
  'parasect': 47,
  'primeape': 57,
  'graveler': 75,
  'venomoth': 49,
  'onix': 95,
  'golem': 76,
};

// Get sprite URL for a pokemon ID
function getPokemonSprite(pokemonId) {
  const number = pokemonNumbers[pokemonId];
  if (number) {
    return `/images/pokemon/${number}.png`;
  }
  return '/images/pokemon/placeholder.png';
}

// Get pokemon name from ID (capitalize and handle special cases)
function getPokemonName(pokemonId) {
  if (pokemonId === 'nidoran-m') return 'Nidoran M';
  if (pokemonId === 'nidoran-f') return 'Nidoran F';
  return pokemonId.charAt(0).toUpperCase() + pokemonId.slice(1);
}

// Terrain color configurations
const terrainColors = {
  grass: { bg: 'rgba(120, 200, 80, 0.15)', border: 'rgba(120, 200, 80, 0.4)' },
  forest: { bg: 'rgba(34, 139, 34, 0.15)', border: 'rgba(34, 139, 34, 0.4)' },
  cave: { bg: 'rgba(128, 128, 128, 0.15)', border: 'rgba(128, 128, 128, 0.4)' },
  water: { bg: 'rgba(104, 144, 240, 0.15)', border: 'rgba(104, 144, 240, 0.4)' },
};

export default function LocationCard({ location, isSelected, onSelect }) {
  const terrain = terrainColors[location.terrain] || terrainColors.grass;
  // Show first 3 pokemon from the pool
  const previewPokemon = location.pokemon.slice(0, 3);

  return (
    <div
      className={`location-card ${isSelected ? 'location-card--selected' : ''}`}
      onClick={() => onSelect(location)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(location);
        }
      }}
    >
      <h3 className="location-card__name">{location.name}</h3>
      <p className="location-card__description">{location.description}</p>

      <div className="location-card__pokemon">
        {previewPokemon.map((p) => (
          <div key={p.id} className="location-card__pokemon-item">
            <img
              src={getPokemonSprite(p.id)}
              alt={getPokemonName(p.id)}
              loading="lazy"
            />
            <span className="location-card__pokemon-name">{getPokemonName(p.id)}</span>
          </div>
        ))}
        {location.pokemon.length > 3 && (
          <div className="location-card__pokemon-more">
            +{location.pokemon.length - 3} more
          </div>
        )}
      </div>

      <div className="location-card__info">
        <span className="location-card__difficulty">Difficulty {location.difficulty}</span>
        <span className="location-card__sr">SR {location.srRange.min}-{location.srRange.max}</span>
      </div>

      <style jsx>{`
        .location-card {
          background: ${terrain.bg};
          border: 2px solid ${terrain.border};
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .location-card:hover {
          transform: translateY(-2px);
          border-color: rgba(251, 191, 36, 0.6);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .location-card:focus {
          outline: 2px solid #fbbf24;
          outline-offset: 2px;
        }

        .location-card--selected {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.15);
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }

        .location-card__name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #fbbf24;
        }

        .location-card__description {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }

        .location-card__pokemon {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .location-card__pokemon-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .location-card__pokemon-item img {
          width: 48px;
          height: 48px;
          image-rendering: pixelated;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 4px;
        }

        .location-card__pokemon-name {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        .location-card__pokemon-more {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          padding: 8px;
        }

        .location-card__info {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .location-card__difficulty {
          font-size: 12px;
          font-weight: 600;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.2);
          padding: 4px 10px;
          border-radius: 4px;
        }

        .location-card__sr {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          background: rgba(0, 0, 0, 0.2);
          padding: 4px 10px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
