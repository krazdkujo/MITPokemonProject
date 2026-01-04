import React from 'react';

/**
 * StarterCard Component
 *
 * Displays a single Pokemon as a selectable card with sprite, name, and types.
 *
 * Props:
 *   - pokemon: Object with id, name, type, sprite, artwork
 *   - onClick: Function called when card is clicked
 *   - selected: Boolean indicating if this card is selected
 */
export default function StarterCard({ pokemon, onClick, selected }) {
  const handleClick = () => {
    if (onClick) {
      onClick(pokemon);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`starter-card ${selected ? 'starter-card--selected' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${pokemon.name}`}
    >
      <div className="starter-card__image">
        {pokemon.sprite ? (
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            loading="lazy"
          />
        ) : (
          <div className="starter-card__placeholder">?</div>
        )}
      </div>

      <div className="starter-card__info">
        <h3 className="starter-card__name">{pokemon.name}</h3>

        <div className="starter-card__types">
          {pokemon.type.map((type) => (
            <span
              key={type}
              className={`starter-card__type starter-card__type--${type.toLowerCase()}`}
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .starter-card {
          background: #ffffff;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .starter-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .starter-card:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .starter-card--selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .starter-card__image {
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .starter-card__image img {
          max-width: 100%;
          max-height: 100%;
          image-rendering: pixelated;
        }

        .starter-card__placeholder {
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

        .starter-card__name {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .starter-card__types {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .starter-card__type {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          color: white;
          background: #888;
        }

        .starter-card__type--normal { background: #A8A878; }
        .starter-card__type--fire { background: #F08030; }
        .starter-card__type--water { background: #6890F0; }
        .starter-card__type--electric { background: #F8D030; color: #333; }
        .starter-card__type--grass { background: #78C850; }
        .starter-card__type--ice { background: #98D8D8; color: #333; }
        .starter-card__type--fighting { background: #C03028; }
        .starter-card__type--poison { background: #A040A0; }
        .starter-card__type--ground { background: #E0C068; color: #333; }
        .starter-card__type--flying { background: #A890F0; }
        .starter-card__type--psychic { background: #F85888; }
        .starter-card__type--bug { background: #A8B820; }
        .starter-card__type--rock { background: #B8A038; }
        .starter-card__type--ghost { background: #705898; }
        .starter-card__type--dragon { background: #7038F8; }
        .starter-card__type--dark { background: #705848; }
        .starter-card__type--steel { background: #B8B8D0; color: #333; }
        .starter-card__type--fairy { background: #EE99AC; }
      `}</style>
    </div>
  );
}
