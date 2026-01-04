/**
 * LocationSelector Component
 *
 * Renders a grid of LocationCard components for selecting
 * an encounter location.
 *
 * Props:
 *   - locations: Array of location objects
 *   - selectedLocation: Currently selected location object (or null)
 *   - onSelectLocation: Callback function when a location is selected
 *   - loading: Boolean indicating if locations are loading
 *   - error: Error message string (or null)
 *   - onRetry: Callback to retry loading locations
 *
 * Feature: 014-wild-encounter
 */

import React from 'react';
import LocationCard from './LocationCard';

export default function LocationSelector({
  locations,
  selectedLocation,
  onSelectLocation,
  loading,
  error,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="location-selector location-selector--loading">
        <div className="location-selector__spinner"></div>
        <p>Loading locations...</p>

        <style jsx>{`
          .location-selector--loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: rgba(255, 255, 255, 0.6);
          }

          .location-selector__spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #fbbf24;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="location-selector location-selector--error">
        <p className="location-selector__error-message">{error}</p>
        <button
          className="location-selector__retry-button"
          onClick={onRetry}
        >
          Try Again
        </button>

        <style jsx>{`
          .location-selector--error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            text-align: center;
          }

          .location-selector__error-message {
            color: #f87171;
            margin-bottom: 16px;
          }

          .location-selector__retry-button {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
          }

          .location-selector__retry-button:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="location-selector location-selector--empty">
        <p>No locations available.</p>

        <style jsx>{`
          .location-selector--empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: rgba(255, 255, 255, 0.6);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="location-selector">
      <h2 className="location-selector__title">Choose a Location</h2>
      <p className="location-selector__subtitle">
        Select an area to search for wild Pokemon
      </p>

      <div className="location-selector__grid">
        {locations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            isSelected={selectedLocation?.id === location.id}
            onSelect={onSelectLocation}
          />
        ))}
      </div>

      <style jsx>{`
        .location-selector {
          margin-bottom: 24px;
        }

        .location-selector__title {
          font-size: 20px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 4px 0;
        }

        .location-selector__subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 20px 0;
        }

        .location-selector__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        @media (max-width: 640px) {
          .location-selector__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
