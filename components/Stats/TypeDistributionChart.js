import React from 'react';
import dynamic from 'next/dynamic';
import EmptyState from './EmptyState';

// Dynamic import to avoid SSR issues with Recharts
const PieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  { ssr: false }
);
const Pie = dynamic(
  () => import('recharts').then(mod => mod.Pie),
  { ssr: false }
);
const Cell = dynamic(
  () => import('recharts').then(mod => mod.Cell),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then(mod => mod.Legend),
  { ssr: false }
);

// Type colors matching Pokemon types
const TYPE_COLORS = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

/**
 * TypeDistributionChart Component
 *
 * Displays a pie chart showing Pokemon type distribution.
 * Dual-type Pokemon are counted in both categories.
 *
 * Props:
 *   - data: Array of { type, count, percentage } objects
 *   - totalPokemon: Total number of Pokemon for context
 */
export default function TypeDistributionChart({ data, totalPokemon }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        message="Catch Pokemon to see type statistics"
        hint="Your collection type breakdown will appear here"
      />
    );
  }

  // Prepare data for pie chart
  const chartData = data.map(item => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
    percentage: item.percentage,
    color: TYPE_COLORS[item.type.toLowerCase()] || '#6b7280',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">{data.value} Pokemon ({data.percentage}%)</p>
          <style jsx>{`
            .custom-tooltip {
              background: white;
              padding: 10px 14px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              border: 1px solid #e5e7eb;
            }
            .tooltip-label {
              font-weight: 600;
              color: #1f2937;
              margin: 0 0 4px 0;
            }
            .tooltip-value {
              color: #6b7280;
              margin: 0;
              font-size: 14px;
            }
          `}</style>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="type-distribution-chart">
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percentage }) => `${name} ${percentage}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="type-legend">
        {chartData.map((item, index) => (
          <div key={index} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: item.color }}
            />
            <span className="legend-label">{item.name}</span>
            <span className="legend-count">{item.value}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .type-distribution-chart {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .chart-container {
          width: 100%;
          min-height: 300px;
        }

        .type-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 13px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legend-label {
          color: #374151;
          font-weight: 500;
        }

        .legend-count {
          color: #6b7280;
          font-size: 12px;
        }

        @media (max-width: 480px) {
          .chart-container {
            min-height: 250px;
          }

          .legend-item {
            font-size: 12px;
            padding: 3px 8px;
          }
        }
      `}</style>
    </div>
  );
}
