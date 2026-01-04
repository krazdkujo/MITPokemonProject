import React from 'react';

/**
 * ConfirmationModal Component
 *
 * Modal dialog for confirming starter Pokemon selection.
 * Shows the selected Pokemon with a warning that the choice is permanent.
 *
 * Props:
 *   - pokemon: Object with id, name, type, sprite, artwork
 *   - isOpen: Boolean to show/hide modal
 *   - onConfirm: Function called when user confirms selection
 *   - onCancel: Function called when user cancels
 *   - isLoading: Boolean to show loading state during API call
 */
export default function ConfirmationModal({
  pokemon,
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen || !pokemon) {
    return null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      onCancel();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        <h2 id="modal-title" className="modal-title">
          Confirm Your Starter
        </h2>

        <div className="modal-pokemon">
          {pokemon.artwork || pokemon.sprite ? (
            <img
              src={pokemon.artwork || pokemon.sprite}
              alt={pokemon.name}
              className="modal-pokemon__image"
            />
          ) : (
            <div className="modal-pokemon__placeholder">?</div>
          )}

          <h3 className="modal-pokemon__name">{pokemon.name}</h3>

          <div className="modal-pokemon__types">
            {pokemon.type.map((type) => (
              <span
                key={type}
                className={`modal-pokemon__type modal-pokemon__type--${type.toLowerCase()}`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        <div className="modal-warning">
          <strong>Warning:</strong> This choice is permanent and cannot be changed.
        </div>

        <div className="modal-actions">
          <button
            className="modal-button modal-button--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="modal-button modal-button--confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Selecting...' : 'Confirm Selection'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-title {
          margin: 0 0 24px 0;
          font-size: 24px;
          color: #333;
        }

        .modal-pokemon {
          margin-bottom: 24px;
        }

        .modal-pokemon__image {
          width: 150px;
          height: 150px;
          object-fit: contain;
          margin-bottom: 16px;
        }

        .modal-pokemon__placeholder {
          width: 150px;
          height: 150px;
          background: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: #999;
          margin: 0 auto 16px;
        }

        .modal-pokemon__name {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 700;
          color: #333;
        }

        .modal-pokemon__types {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .modal-pokemon__type {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          text-transform: capitalize;
          color: white;
          background: #888;
        }

        .modal-pokemon__type--normal { background: #A8A878; }
        .modal-pokemon__type--fire { background: #F08030; }
        .modal-pokemon__type--water { background: #6890F0; }
        .modal-pokemon__type--electric { background: #F8D030; color: #333; }
        .modal-pokemon__type--grass { background: #78C850; }
        .modal-pokemon__type--ice { background: #98D8D8; color: #333; }
        .modal-pokemon__type--fighting { background: #C03028; }
        .modal-pokemon__type--poison { background: #A040A0; }
        .modal-pokemon__type--ground { background: #E0C068; color: #333; }
        .modal-pokemon__type--flying { background: #A890F0; }
        .modal-pokemon__type--psychic { background: #F85888; }
        .modal-pokemon__type--bug { background: #A8B820; }
        .modal-pokemon__type--rock { background: #B8A038; }
        .modal-pokemon__type--ghost { background: #705898; }
        .modal-pokemon__type--dragon { background: #7038F8; }
        .modal-pokemon__type--dark { background: #705848; }
        .modal-pokemon__type--steel { background: #B8B8D0; color: #333; }
        .modal-pokemon__type--fairy { background: #EE99AC; }

        .modal-warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #92400e;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .modal-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-button--cancel {
          background: #e5e7eb;
          color: #374151;
        }

        .modal-button--cancel:hover:not(:disabled) {
          background: #d1d5db;
        }

        .modal-button--confirm {
          background: #3b82f6;
          color: white;
        }

        .modal-button--confirm:hover:not(:disabled) {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}
