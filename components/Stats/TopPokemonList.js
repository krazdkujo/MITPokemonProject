import React from 'react';
import EmptyState from './EmptyState';

/**
 * TopPokemonList Component
 *
 * Displays a ranked list of the player's highest-level Pokemon.
 * Shows sprite, name, level, and type badges.
 *
 * Props:
 *   - pokemon: Array of top Pokemon objects with id, name, level, sprite, type
 */
export default function TopPokemonList({ pokemon }) {
  if (!pokemon || pokemon.length === 0) {
    return (
      <EmptyState
        message="No Pokemon yet"
        hint="Catch Pokemon to see your top performers"
      />
    );
  }

  return (
    <div className="top-pokemon-list">
      {pokemon.map((p, index) => (
        <div key={p.id} className="top-pokemon-item">
          <span className="top-pokemon-item__rank">#{index + 1}</span>
          <img
            src={p.sprite}
            alt={p.name}
            className="top-pokemon-item__sprite"
            onError={(e) => {
              e.target.src = '/images/pokemon/placeholder.png';
            }}
          />
          <div className="top-pokemon-item__info">
            <span className="top-pokemon-item__name">{p.name}</span>
            <div className="top-pokemon-item__types">
              {p.type && p.type.map(type => (
                <span
                  key={type}
                  className={`type-badge type-badge--${type.toLowerCase()}`}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
          <span className="top-pokemon-item__level">Lv. {p.level}</span>
        </div>
      ))}

      <style jsx>{`
        .top-pokemon-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .top-pokemon-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .top-pokemon-item:hover {
          background: #f3f4f6;
        }

        .top-pokemon-item__rank {
          font-size: 14px;
          font-weight: 700;
          color: #6b7280;
          min-width: 28px;
        }

        .top-pokemon-item__sprite {
          width: 48px;
          height: 48px;
          image-rendering: pixelated;
        }

        .top-pokemon-item__info {
          flex: 1;
          min-width: 0;
        }

        .top-pokemon-item__name {
          display: block;
          font-weight: 600;
          color: #1f2937;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .top-pokemon-item__types {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .type-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
          color: white;
          background: #6b7280;
        }

        .type-badge--normal { background: #A8A878; }
        .type-badge--fire { background: #F08030; }
        .type-badge--water { background: #6890F0; }
        .type-badge--electric { background: #F8D030; color: #1f2937; }
        .type-badge--grass { background: #78C850; }
        .type-badge--ice { background: #98D8D8; color: #1f2937; }
        .type-badge--fighting { background: #C03028; }
        .type-badge--poison { background: #A040A0; }
        .type-badge--ground { background: #E0C068; color: #1f2937; }
        .type-badge--flying { background: #A890F0; }
        .type-badge--psychic { background: #F85888; }
        .type-badge--bug { background: #A8B820; }
        .type-badge--rock { background: #B8A038; }
        .type-badge--ghost { background: #705898; }
        .type-badge--dragon { background: #7038F8; }
        .type-badge--dark { background: #705848; }
        .type-badge--steel { background: #B8B8D0; color: #1f2937; }
        .type-badge--fairy { background: #EE99AC; color: #1f2937; }

        .top-pokemon-item__level {
          font-size: 16px;
          font-weight: 700;
          color: #4f46e5;
          background: #eef2ff;
          padding: 6px 12px;
          border-radius: 8px;
        }

        @media (max-width: 480px) {
          .top-pokemon-item {
            padding: 10px;
          }

          .top-pokemon-item__sprite {
            width: 40px;
            height: 40px;
          }

          .top-pokemon-item__name {
            font-size: 14px;
          }

          .top-pokemon-item__level {
            font-size: 14px;
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
}
