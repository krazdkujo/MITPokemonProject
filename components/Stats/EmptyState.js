import React from 'react';

/**
 * EmptyState Component
 *
 * Displays a friendly message when no data is available.
 * Used across Stats components for consistent empty state handling.
 *
 * Props:
 *   - message: Custom message to display (required)
 *   - hint: Optional secondary hint text
 */
export default function EmptyState({ message, hint }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <p className="empty-state__message">{message}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          min-height: 200px;
        }

        .empty-state__icon {
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .empty-state__message {
          color: #6b7280;
          font-size: 16px;
          margin: 0 0 8px 0;
          max-width: 280px;
        }

        .empty-state__hint {
          color: #9ca3af;
          font-size: 14px;
          margin: 0;
          max-width: 280px;
        }
      `}</style>
    </div>
  );
}
