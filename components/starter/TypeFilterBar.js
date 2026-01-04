import React, { useState, useEffect } from 'react';

/**
 * TypeFilterBar Component
 *
 * Displays type filter buttons for starter Pokemon.
 * Allows selecting up to 2 types to filter by.
 *
 * Props:
 *   - availableTypes: Array of type strings to display
 *   - selectedTypes: Array of currently selected types
 *   - onChange: Function called when selection changes, receives array of selected types
 *   - maxSelection: Maximum number of types that can be selected (default: 2)
 */
export default function TypeFilterBar({
  availableTypes = [],
  selectedTypes = [],
  onChange,
  maxSelection = 2,
}) {
  const handleTypeClick = (type) => {
    if (!onChange) return;

    const lowerType = type.toLowerCase();
    const isSelected = selectedTypes.includes(lowerType);

    if (isSelected) {
      // Remove type from selection
      onChange(selectedTypes.filter(t => t !== lowerType));
    } else {
      // Add type if under max selection
      if (selectedTypes.length < maxSelection) {
        onChange([...selectedTypes, lowerType]);
      } else {
        // Replace oldest selection with new one
        onChange([...selectedTypes.slice(1), lowerType]);
      }
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange([]);
    }
  };

  return (
    <div className="type-filter-bar">
      <div className="type-filter-bar__header">
        <span className="type-filter-bar__label">Filter by Type:</span>
        {selectedTypes.length > 0 && (
          <button
            className="type-filter-bar__clear"
            onClick={handleClear}
            aria-label="Clear filters"
          >
            Clear
          </button>
        )}
      </div>

      <div className="type-filter-bar__types">
        {availableTypes.map((type) => {
          const isSelected = selectedTypes.includes(type.toLowerCase());
          return (
            <button
              key={type}
              className={`type-filter-bar__type type-filter-bar__type--${type.toLowerCase()} ${
                isSelected ? 'type-filter-bar__type--selected' : ''
              }`}
              onClick={() => handleTypeClick(type)}
              aria-pressed={isSelected}
            >
              {type}
            </button>
          );
        })}
      </div>

      {selectedTypes.length > 0 && (
        <div className="type-filter-bar__info">
          Showing Pokemon with: {selectedTypes.join(' and ')}
          {selectedTypes.length >= maxSelection && (
            <span className="type-filter-bar__max"> (max {maxSelection} types)</span>
          )}
        </div>
      )}

      <style jsx>{`
        .type-filter-bar {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .type-filter-bar__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .type-filter-bar__label {
          font-weight: 600;
          color: #333;
        }

        .type-filter-bar__clear {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .type-filter-bar__clear:hover {
          text-decoration: underline;
        }

        .type-filter-bar__types {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .type-filter-bar__type {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          text-transform: capitalize;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s ease;
          color: white;
          background: #888;
          opacity: 0.7;
        }

        .type-filter-bar__type:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        .type-filter-bar__type--selected {
          opacity: 1;
          border-color: #1e3a5f;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .type-filter-bar__type--normal { background: #A8A878; }
        .type-filter-bar__type--fire { background: #F08030; }
        .type-filter-bar__type--water { background: #6890F0; }
        .type-filter-bar__type--electric { background: #F8D030; color: #333; }
        .type-filter-bar__type--grass { background: #78C850; }
        .type-filter-bar__type--ice { background: #98D8D8; color: #333; }
        .type-filter-bar__type--fighting { background: #C03028; }
        .type-filter-bar__type--poison { background: #A040A0; }
        .type-filter-bar__type--ground { background: #E0C068; color: #333; }
        .type-filter-bar__type--flying { background: #A890F0; }
        .type-filter-bar__type--psychic { background: #F85888; }
        .type-filter-bar__type--bug { background: #A8B820; }
        .type-filter-bar__type--rock { background: #B8A038; }
        .type-filter-bar__type--ghost { background: #705898; }
        .type-filter-bar__type--dragon { background: #7038F8; }
        .type-filter-bar__type--dark { background: #705848; }
        .type-filter-bar__type--steel { background: #B8B8D0; color: #333; }
        .type-filter-bar__type--fairy { background: #EE99AC; }

        .type-filter-bar__info {
          margin-top: 12px;
          font-size: 13px;
          color: #666;
        }

        .type-filter-bar__max {
          color: #999;
        }

        @media (max-width: 640px) {
          .type-filter-bar__types {
            gap: 6px;
          }

          .type-filter-bar__type {
            padding: 4px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
