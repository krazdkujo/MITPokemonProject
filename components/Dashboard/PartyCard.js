import React from 'react';
import HPBar from './HPBar';

/**
 * PartyCard Component
 *
 * Displays a single Pokemon in the active party with:
 * - Sprite image (with fallback for missing images)
 * - Name
 * - Type badges
 * - Level
 * - HP bar
 *
 * Props:
 *   - pokemon: Object with name, type, level, current_hp, max_hp, sprite, artwork
 */
export default function PartyCard({ pokemon }) {
  const imageUrl = pokemon.sprite || pokemon.artwork;

  return (
    <div className="party-card">
      <div className="party-card__image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={pokemon.name}
            loading="lazy"
          />
        ) : (
          <div className="party-card__placeholder">?</div>
        )}
      </div>

      <div className="party-card__info">
        <h3 className="party-card__name">{pokemon.name}</h3>

        <div className="party-card__types">
          {pokemon.type.map((type) => (
            <span
              key={type}
              className={`party-card__type party-card__type--${type.toLowerCase()}`}
            >
              {type}
            </span>
          ))}
        </div>

        <p className="party-card__level">Lv. {pokemon.level}</p>

        <HPBar current={pokemon.current_hp} max={pokemon.max_hp} />
      </div>

      <style jsx>{`
        .party-card {
          background: #ffffff;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.2s ease;
        }

        .party-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .party-card__image {
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .party-card__image img {
          max-width: 100%;
          max-height: 100%;
          image-rendering: pixelated;
        }

        .party-card__placeholder {
          width: 64px;
          height: 64px;
          background: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #999;
        }

        .party-card__info {
          width: 100%;
        }

        .party-card__name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .party-card__types {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 8px;
        }

        .party-card__type {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          color: white;
          background: #888;
        }

        .party-card__type--normal { background: #A8A878; }
        .party-card__type--fire { background: #F08030; }
        .party-card__type--water { background: #6890F0; }
        .party-card__type--electric { background: #F8D030; color: #333; }
        .party-card__type--grass { background: #78C850; }
        .party-card__type--ice { background: #98D8D8; color: #333; }
        .party-card__type--fighting { background: #C03028; }
        .party-card__type--poison { background: #A040A0; }
        .party-card__type--ground { background: #E0C068; color: #333; }
        .party-card__type--flying { background: #A890F0; }
        .party-card__type--psychic { background: #F85888; }
        .party-card__type--bug { background: #A8B820; }
        .party-card__type--rock { background: #B8A038; }
        .party-card__type--ghost { background: #705898; }
        .party-card__type--dragon { background: #7038F8; }
        .party-card__type--dark { background: #705848; }
        .party-card__type--steel { background: #B8B8D0; color: #333; }
        .party-card__type--fairy { background: #EE99AC; }

        .party-card__level {
          margin: 0 0 12px 0;
          color: #666;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
