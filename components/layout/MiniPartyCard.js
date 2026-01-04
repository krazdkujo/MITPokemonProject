/**
 * MiniPartyCard Component
 *
 * Compact Pokemon card for mini party display:
 * - Pokemon sprite/image
 * - Mini HP bar
 * - Fainted indicator (grayscale + opacity)
 * - Click navigates to Pokemon Center
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import { useRouter } from 'next/router';
import MiniHPBar from './MiniHPBar';

export default function MiniPartyCard({ pokemon }) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/pokecenter');
  };

  const { name, level, current_hp, max_hp, sprite_url, is_fainted } = pokemon;

  return (
    <div
      className={`mini-party-card ${is_fainted ? 'mini-party-card--fainted' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      title={`${name} - Click to visit Pokemon Center`}
    >
      <div className="mini-party-card__sprite">
        <img
          src={sprite_url}
          alt={name}
          onError={(e) => {
            e.target.src = '/images/pokemon/placeholder.png';
          }}
        />
        {is_fainted && (
          <div className="mini-party-card__fainted-badge">X</div>
        )}
      </div>
      <div className="mini-party-card__info">
        <div className="mini-party-card__name">{name}</div>
        <div className="mini-party-card__level">Lv.{level}</div>
        <MiniHPBar current={current_hp} max={max_hp} />
      </div>

      <style jsx>{`
        .mini-party-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .mini-party-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .mini-party-card--fainted {
          opacity: 0.6;
        }

        .mini-party-card--fainted .mini-party-card__sprite img {
          filter: grayscale(100%);
        }

        .mini-party-card__sprite {
          position: relative;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
        }

        .mini-party-card__sprite img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          image-rendering: pixelated;
        }

        .mini-party-card__fainted-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: #f87171;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }

        .mini-party-card__info {
          flex: 1;
          min-width: 0;
        }

        .mini-party-card__name {
          color: white;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mini-party-card__level {
          color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
