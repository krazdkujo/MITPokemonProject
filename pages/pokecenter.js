/**
 * Pokemon Center Page
 *
 * Healing interface where players can:
 * - View party health status with color-coded HP bars
 * - Heal all Pokemon with a single button click
 * - See success/error messages for healing actions
 *
 * Feature: 012-pokecenter-page
 */

import React, { useState } from 'react';
import GameLayout from '../components/layout/GameLayout';
import { useGame } from '../lib/gameContext';
import { apiFetch } from '../lib/apiFetch';
import PartyCard from '../components/Dashboard/PartyCard';

/**
 * NurseJoyWelcome - Themed welcome message header
 */
function NurseJoyWelcome() {
  return (
    <div className="nurse-joy-welcome">
      <div className="welcome-icon">+</div>
      <div className="welcome-text">
        <h1>Pokemon Center</h1>
        <p className="welcome-message">
          "Welcome to the Pokemon Center! I'll heal your Pokemon back to full health."
        </p>
        <p className="nurse-joy-signature">- Nurse Joy</p>
      </div>

      <style jsx>{`
        .nurse-joy-welcome {
          display: flex;
          align-items: center;
          gap: 20px;
          background: linear-gradient(135deg, rgba(233, 69, 96, 0.2) 0%, rgba(233, 69, 96, 0.1) 100%);
          border: 1px solid rgba(233, 69, 96, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .welcome-icon {
          width: 64px;
          height: 64px;
          background: #e94560;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
        }

        .welcome-text h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
          color: #fbbf24;
        }

        .welcome-message {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          margin: 0;
          font-style: italic;
          line-height: 1.5;
        }

        .nurse-joy-signature {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 8px 0 0 0;
        }
      `}</style>
    </div>
  );
}

/**
 * StatusMessage - Success/error/info message display
 */
function StatusMessage({ message, type }) {
  if (!message) return null;

  return (
    <div className={`status-message status-message--${type}`}>
      {message}

      <style jsx>{`
        .status-message {
          text-align: center;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          margin-top: 24px;
        }

        .status-message--success {
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.3);
        }

        .status-message--error {
          background: rgba(248, 113, 113, 0.2);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.3);
        }

        .status-message--info {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }
      `}</style>
    </div>
  );
}

/**
 * HealButton - Main action button for healing
 */
function HealButton({ onClick, disabled, healing }) {
  return (
    <div className="heal-button-container">
      <button
        className={`heal-button ${disabled ? 'heal-button--disabled' : ''}`}
        onClick={onClick}
        disabled={disabled || healing}
      >
        {healing ? 'Healing...' : 'Heal All'}
      </button>

      <style jsx>{`
        .heal-button-container {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }

        .heal-button {
          padding: 16px 48px;
          font-size: 18px;
          font-weight: 600;
          background: linear-gradient(135deg, #e94560 0%, #d63d56 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(233, 69, 96, 0.4);
        }

        .heal-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(233, 69, 96, 0.5);
        }

        .heal-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .heal-button--disabled,
        .heal-button:disabled {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}

/**
 * EmptyPartyMessage - Shown when player has no Pokemon
 */
function EmptyPartyMessage() {
  return (
    <div className="empty-party">
      <div className="empty-icon">?</div>
      <h2>No Pokemon Found</h2>
      <p>You have no Pokemon! Select a starter first.</p>
      <a href="/dashboard" className="start-link">
        Go to Dashboard
      </a>

      <style jsx>{`
        .empty-party {
          text-align: center;
          padding: 48px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0 auto 24px;
        }

        .empty-party h2 {
          color: white;
          font-size: 24px;
          margin: 0 0 12px 0;
        }

        .empty-party p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0 0 24px 0;
        }

        .start-link {
          display: inline-block;
          padding: 12px 32px;
          background: #fbbf24;
          color: #1a1a2e;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .start-link:hover {
          background: #f59e0b;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

/**
 * PartyDisplay - Grid display of party Pokemon
 */
function PartyDisplay({ party }) {
  return (
    <div className="party-display">
      <h2 className="party-title">Your Party</h2>
      <div className="party-grid">
        {party.map((pokemon) => (
          <PartyCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </div>

      <style jsx>{`
        .party-display {
          margin-bottom: 16px;
        }

        .party-title {
          color: white;
          font-size: 20px;
          margin: 0 0 16px 0;
        }

        .party-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .party-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .party-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * PokeCenterContent - Main content with business logic
 */
function PokeCenterContent() {
  const { party, refreshData, loading, error } = useGame();

  // Local UI state
  const [healing, setHealing] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  // Calculate if party needs healing
  const needsHealing = party.length > 0 && party.some(
    (pokemon) => pokemon.current_hp < pokemon.max_hp
  );

  // Handle heal action
  const handleHeal = async () => {
    setHealing(true);
    setMessage(null);

    try {
      const response = await apiFetch('/api/heal', { method: 'POST' });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Healing failed');
      }

      await refreshData(); // Update context with new HP values
      setMessage('Your Pokemon have been healed!');
      setMessageType('success');
    } catch (err) {
      setMessage(err.message || 'Failed to heal. Please try again.');
      setMessageType('error');
    } finally {
      setHealing(false);
    }
  };

  // Loading state is handled by GameLayout

  // Error state
  if (error) {
    return (
      <div className="pokecenter-page">
        <NurseJoyWelcome />
        <StatusMessage message={error} type="error" />
        <style jsx>{`
          .pokecenter-page {
            color: white;
          }
        `}</style>
      </div>
    );
  }

  // Empty party state
  if (party.length === 0) {
    return (
      <div className="pokecenter-page">
        <NurseJoyWelcome />
        <EmptyPartyMessage />
        <style jsx>{`
          .pokecenter-page {
            color: white;
          }
        `}</style>
      </div>
    );
  }

  // Normal state with party
  return (
    <div className="pokecenter-page">
      <NurseJoyWelcome />

      <PartyDisplay party={party} />

      {/* Show "already healthy" info if no healing needed */}
      {!needsHealing && !message && (
        <StatusMessage
          message="Your Pokemon are already healthy!"
          type="info"
        />
      )}

      <HealButton
        onClick={handleHeal}
        disabled={!needsHealing}
        healing={healing}
      />

      {/* Show success/error messages after heal action */}
      {message && <StatusMessage message={message} type={messageType} />}

      <style jsx>{`
        .pokecenter-page {
          color: white;
          max-width: 900px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}

/**
 * PokeCenterPage - Main export wrapped with GameLayout
 */
export default function PokeCenterPage() {
  return (
    <GameLayout>
      <PokeCenterContent />
    </GameLayout>
  );
}
