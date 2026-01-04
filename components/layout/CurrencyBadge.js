/**
 * CurrencyBadge Component
 *
 * Displays player's currency balance with:
 * - Coin icon
 * - Formatted number
 * - Update animation when value changes
 *
 * Feature: 011-game-layout
 */

import React, { useState, useEffect } from 'react';
import { CoinIcon } from './NavIcons';

export default function CurrencyBadge({ amount }) {
  const [prevAmount, setPrevAmount] = useState(amount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (amount !== prevAmount) {
      setAnimating(true);
      setPrevAmount(amount);
      const timer = setTimeout(() => setAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [amount, prevAmount]);

  // Format large numbers with commas
  const formattedAmount = amount.toLocaleString();

  return (
    <div className={`currency-badge ${animating ? 'currency-badge--animating' : ''}`}>
      <span className="currency-badge__icon">
        <CoinIcon />
      </span>
      <span className="currency-badge__amount">{formattedAmount}</span>

      <style jsx>{`
        .currency-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(251, 191, 36, 0.2);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 20px;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .currency-badge--animating {
          animation: pulse 0.5s ease;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            background: rgba(251, 191, 36, 0.2);
          }
          50% {
            transform: scale(1.1);
            background: rgba(251, 191, 36, 0.4);
          }
          100% {
            transform: scale(1);
            background: rgba(251, 191, 36, 0.2);
          }
        }

        .currency-badge__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          color: #fbbf24;
        }

        .currency-badge__icon :global(svg) {
          width: 16px;
          height: 16px;
        }

        .currency-badge__amount {
          color: #fbbf24;
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
