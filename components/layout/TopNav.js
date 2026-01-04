/**
 * TopNav Component
 *
 * Top navigation bar containing:
 * - Game logo/title (left)
 * - Currency badge (center-right)
 * - Player name/avatar (right)
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import { useGame } from '../../lib/gameContext';
import CurrencyBadge from './CurrencyBadge';

export default function TopNav() {
  const { playerName, currency } = useGame();

  return (
    <header className="top-nav">
      <div className="top-nav__logo">
        <span className="top-nav__title">Pokemon 5e</span>
      </div>

      <div className="top-nav__right">
        <CurrencyBadge amount={currency} />
        <div className="top-nav__player">
          <span className="top-nav__player-name">{playerName || 'Trainer'}</span>
        </div>
      </div>

      <style jsx>{`
        .top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .top-nav__logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .top-nav__title {
          font-size: 24px;
          font-weight: 700;
          color: #fbbf24;
          letter-spacing: -0.5px;
        }

        .top-nav__right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .top-nav__player {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .top-nav__player-name {
          color: white;
          font-weight: 500;
          font-size: 14px;
        }
      `}</style>
    </header>
  );
}
