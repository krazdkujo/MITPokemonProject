import React from 'react';

/**
 * StatsCard Component
 *
 * Wrapper component for statistics sections with consistent styling.
 * Provides a titled card container for stats visualizations.
 *
 * Props:
 *   - title: Card header title (required)
 *   - children: Card content
 *   - className: Additional CSS class
 */
export default function StatsCard({ title, children, className = '' }) {
  return (
    <div className={`stats-card ${className}`}>
      {title && <h3 className="stats-card__title">{title}</h3>}
      <div className="stats-card__content">
        {children}
      </div>

      <style jsx>{`
        .stats-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .stats-card__title {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 12px;
        }

        .stats-card__content {
          min-height: 100px;
        }

        @media (max-width: 768px) {
          .stats-card {
            padding: 16px;
          }

          .stats-card__title {
            font-size: 16px;
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
}
