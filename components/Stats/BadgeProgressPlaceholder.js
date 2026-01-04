import React from 'react';

/**
 * BadgeProgressPlaceholder Component
 *
 * Displays a placeholder for badge progression tracking.
 * Badge tracking requires database tables not yet implemented.
 */
export default function BadgeProgressPlaceholder() {
  return (
    <div className="badge-progress-placeholder">
      <div className="placeholder-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="8" r="6" />
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </svg>
      </div>
      <h4 className="placeholder-title">Badge Progress</h4>
      <p className="placeholder-message">Coming Soon</p>
      <p className="placeholder-description">
        Track your gym badge collection and progression timeline once the badge system is implemented.
      </p>

      <div className="badge-preview">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="badge-slot" />
        ))}
      </div>

      <style jsx>{`
        .badge-progress-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          opacity: 0.85;
        }

        .placeholder-icon {
          color: #2563eb;
          margin-bottom: 12px;
        }

        .placeholder-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          margin: 0 0 8px 0;
        }

        .placeholder-message {
          font-size: 14px;
          font-weight: 700;
          color: #1d4ed8;
          margin: 0 0 12px 0;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
        }

        .placeholder-description {
          font-size: 13px;
          color: #1e3a8a;
          margin: 0 0 20px 0;
          max-width: 280px;
          line-height: 1.5;
        }

        .badge-preview {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .badge-slot {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.4);
          border: 2px dashed #93c5fd;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
