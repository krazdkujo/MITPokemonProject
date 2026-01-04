import React from 'react';
import dynamic from 'next/dynamic';
import EmptyState from './EmptyState';

// Dynamic import to avoid SSR issues with Recharts
const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then(mod => mod.CartesianGrid),
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

/**
 * LevelDistributionChart Component
 *
 * Displays a bar chart showing Pokemon distribution across level ranges.
 * Ranges: 1-5, 6-10, 11-15, 16-20
 *
 * Props:
 *   - distribution: Object with level range keys and count values
 */
export default function LevelDistributionChart({ distribution }) {
  // Check if all values are 0
  const hasData = distribution && Object.values(distribution).some(v => v > 0);

  if (!hasData) {
    return (
      <EmptyState
        message="No level data available"
        hint="Train your Pokemon to see level distribution"
      />
    );
  }

  // Prepare data for bar chart
  const chartData = [
    { range: '1-5', count: distribution['1-5'] || 0, fill: '#93c5fd' },
    { range: '6-10', count: distribution['6-10'] || 0, fill: '#60a5fa' },
    { range: '11-15', count: distribution['11-15'] || 0, fill: '#3b82f6' },
    { range: '16-20', count: distribution['16-20'] || 0, fill: '#2563eb' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">Level {label}</p>
          <p className="tooltip-value">{payload[0].value} Pokemon</p>
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
              color: #3b82f6;
              margin: 0;
              font-size: 14px;
              font-weight: 500;
            }
          `}</style>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="level-distribution-chart">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="range"
            tick={{ fill: '#6b7280', fontSize: 13 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#6b7280', fontSize: 13 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            radius={[6, 6, 0, 0]}
            fill="#3b82f6"
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="level-summary">
        {chartData.map((item, index) => (
          <div key={index} className="summary-item">
            <span className="summary-range">Lv. {item.range}</span>
            <span className="summary-count">{item.count}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .level-distribution-chart {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .level-summary {
          display: flex;
          justify-content: space-around;
          gap: 8px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 16px;
          background: #f3f4f6;
          border-radius: 8px;
          flex: 1;
        }

        .summary-range {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .summary-count {
          font-size: 20px;
          font-weight: 700;
          color: #3b82f6;
        }

        @media (max-width: 480px) {
          .summary-item {
            padding: 8px 12px;
          }

          .summary-range {
            font-size: 11px;
          }

          .summary-count {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
