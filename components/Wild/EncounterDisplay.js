/**
 * EncounterDisplay Component
 *
 * Displays a wild Pokemon encounter with:
 * - Pokemon sprite (large)
 * - Pokemon name
 * - Level
 * - Type badges with appropriate colors
 *
 * Props:
 *   - pokemon: Object with pokemon_id, name, level, type (array)
 *   - pokemonNumber: National dex number for sprite path
 *
 * Feature: 014-wild-encounter
 */

import React from 'react';

// Type color mapping (matching PartyCard.js)
const typeColors = {
  normal: { bg: '#A8A878', text: 'white' },
  fire: { bg: '#F08030', text: 'white' },
  water: { bg: '#6890F0', text: 'white' },
  electric: { bg: '#F8D030', text: '#333' },
  grass: { bg: '#78C850', text: 'white' },
  ice: { bg: '#98D8D8', text: '#333' },
  fighting: { bg: '#C03028', text: 'white' },
  poison: { bg: '#A040A0', text: 'white' },
  ground: { bg: '#E0C068', text: '#333' },
  flying: { bg: '#A890F0', text: 'white' },
  psychic: { bg: '#F85888', text: 'white' },
  bug: { bg: '#A8B820', text: 'white' },
  rock: { bg: '#B8A038', text: 'white' },
  ghost: { bg: '#705898', text: 'white' },
  dragon: { bg: '#7038F8', text: 'white' },
  dark: { bg: '#705848', text: 'white' },
  steel: { bg: '#B8B8D0', text: '#333' },
  fairy: { bg: '#EE99AC', text: 'white' },
};

export default function EncounterDisplay({ pokemon, pokemonNumber }) {
  const spriteUrl = pokemonNumber
    ? `/images/pokemon/${pokemonNumber}.png`
    : '/images/pokemon/placeholder.png';

  return (
    <div className="encounter-display">
      <div className="encounter-display__header">
        <span className="encounter-display__wild">Wild</span>
        <h2 className="encounter-display__name">{pokemon.name}</h2>
        <span className="encounter-display__appeared">appeared!</span>
      </div>

      <div className="encounter-display__sprite">
        <img src={spriteUrl} alt={pokemon.name} />
      </div>

      <div className="encounter-display__info">
        <span className="encounter-display__level">Lv. {pokemon.level}</span>

        <div className="encounter-display__types">
          {pokemon.type && pokemon.type.map((type) => {
            const typeStyle = typeColors[type.toLowerCase()] || typeColors.normal;
            return (
              <span
                key={type}
                className="encounter-display__type"
                style={{
                  backgroundColor: typeStyle.bg,
                  color: typeStyle.text,
                }}
              >
                {type}
              </span>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .encounter-display {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          max-width: 400px;
          margin: 0 auto;
        }

        .encounter-display__header {
          margin-bottom: 16px;
        }

        .encounter-display__wild {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          display: block;
          margin-bottom: 4px;
        }

        .encounter-display__name {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #fbbf24;
        }

        .encounter-display__appeared {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          display: block;
          margin-top: 4px;
        }

        .encounter-display__sprite {
          width: 160px;
          height: 160px;
          margin: 16px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
        }

        .encounter-display__sprite img {
          max-width: 140px;
          max-height: 140px;
          image-rendering: pixelated;
        }

        .encounter-display__info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .encounter-display__level {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .encounter-display__types {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .encounter-display__type {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}
