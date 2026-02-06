// ============================================================================
// RiskHeatMap — Enhanced 5×5 risk matrix with smooth gradients & animations
// Custom SVG (Recharts doesn't support heat maps natively)
// ============================================================================

import React, { useState } from 'react';
import { ANIMATION, getChartColors } from '../../utils/chartTheme';
import { useTheme } from '../../hooks/useTheme';

interface RiskCell {
  likelihood: number; // 1–5
  impact: number;     // 1–5
  count: number;
  score: number;      // likelihood × impact
}

interface RiskHeatMapProps {
  risks: RiskCell[];
  size?: number;
  showLabels?: boolean;
  onCellClick?: (cell: RiskCell) => void;
  compact?: boolean;
}

const LIKELIHOOD_LABELS = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
const IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'];

function cellColor(score: number): string {
  if (score >= 20) return '#dc2626'; // red-600
  if (score >= 15) return '#ea580c'; // orange-600
  if (score >= 10) return '#f59e0b'; // amber-500
  if (score >= 5)  return '#eab308'; // yellow-500
  return '#22c55e';                   // green-500
}

function cellBg(score: number): string {
  if (score >= 20) return '#fef2f2'; // red-50
  if (score >= 15) return '#fff7ed'; // orange-50
  if (score >= 10) return '#fffbeb'; // amber-50
  if (score >= 5)  return '#fefce8'; // yellow-50
  return '#f0fdf4';                   // green-50
}

export function RiskHeatMap({
  risks,
  size = 340,
  showLabels = true,
  onCellClick,
  compact = false,
}: RiskHeatMapProps) {
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);
  const [hovered, setHovered] = useState<string | null>(null);

  // Build 5×5 grid lookup
  const gridMap = new Map<string, RiskCell>();
  risks.forEach((r) => gridMap.set(`${r.likelihood}-${r.impact}`, r));

  const cellSize = compact ? (size - 30) / 5 : (size - 60) / 5;
  const padding = compact ? 30 : 60;
  const svgSize = size;

  return (
    <div className="w-full max-w-[380px]">
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="select-none w-full h-auto"
      >
        {/* Y-axis label */}
        {showLabels && !compact && (
          <text
            x={14}
            y={svgSize / 2}
            transform={`rotate(-90, 14, ${svgSize / 2})`}
            fontSize="11"
            fill={colors.axisText}
            textAnchor="middle"
            fontWeight={600}
          >
            Likelihood →
          </text>
        )}

        {/* X-axis label */}
        {showLabels && !compact && (
          <text
            x={padding + (cellSize * 5) / 2}
            y={svgSize - 6}
            fontSize="11"
            fill={colors.axisText}
            textAnchor="middle"
            fontWeight={600}
          >
            Impact →
          </text>
        )}

        {/* Grid cells — likelihood on Y (5 at top), impact on X (1 at left) */}
        {[5, 4, 3, 2, 1].map((likelihood, yi) =>
          [1, 2, 3, 4, 5].map((impact, xi) => {
            const key = `${likelihood}-${impact}`;
            const cell = gridMap.get(key);
            const score = likelihood * impact;
            const x = padding + xi * cellSize;
            const y = (compact ? 0 : 20) + yi * cellSize;
            const isHovered = hovered === key;
            const hasRisks = cell && cell.count > 0;

            return (
              <g
                key={key}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => hasRisks && onCellClick?.(cell)}
                style={{ cursor: hasRisks && onCellClick ? 'pointer' : 'default' }}
              >
                {/* Cell background */}
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  rx={6}
                  fill={cellBg(score)}
                  stroke={isHovered ? cellColor(score) : colors.grid}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{
                    transition: `all ${ANIMATION.duration / 2}ms ease-in-out`,
                    opacity: isHovered ? 1 : 0.9,
                  }}
                />

                {/* Filled indicator if risks exist */}
                {hasRisks && (
                  <rect
                    x={x + 4}
                    y={y + 4}
                    width={cellSize - 8}
                    height={cellSize - 8}
                    rx={4}
                    fill={cellColor(score)}
                    opacity={isHovered ? 0.25 : 0.15}
                    style={{ transition: `opacity ${ANIMATION.duration / 2}ms ease` }}
                  />
                )}

                {/* Count number */}
                {hasRisks && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 - (compact ? 0 : 2)}
                    fontSize={compact ? 12 : 16}
                    fontWeight={700}
                    fill={cellColor(score)}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {cell.count}
                  </text>
                )}

                {/* Score subscript */}
                {!compact && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 12}
                    fontSize="9"
                    fill={colors.axisText}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {score}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Y-axis tick labels (likelihood 1–5) */}
        {showLabels &&
          [5, 4, 3, 2, 1].map((val, yi) => (
            <text
              key={`y-${val}`}
              x={padding - 4}
              y={(compact ? 0 : 20) + yi * cellSize + cellSize / 2}
              fontSize="10"
              fill={colors.axisText}
              textAnchor="end"
              dominantBaseline="central"
            >
              {compact ? val : LIKELIHOOD_LABELS[val - 1]}
            </text>
          ))}

        {/* X-axis tick labels (impact 1–5) */}
        {showLabels &&
          [1, 2, 3, 4, 5].map((val, xi) => (
            <text
              key={`x-${val}`}
              x={padding + xi * cellSize + cellSize / 2}
              y={(compact ? 0 : 20) + 5 * cellSize + 14}
              fontSize="10"
              fill={colors.axisText}
              textAnchor="middle"
            >
              {compact ? val : IMPACT_LABELS[val - 1]}
            </text>
          ))}
      </svg>

      {/* Hover tooltip */}
      {hovered && (() => {
        const [lStr, iStr] = hovered.split('-');
        const l = parseInt(lStr);
        const imp = parseInt(iStr);
        const cell = gridMap.get(hovered);
        return (
          <div className="mt-2 bg-gray-900/95 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-700 inline-block">
            <p className="font-semibold">
              Likelihood: {LIKELIHOOD_LABELS[l - 1]} ({l}) × Impact: {IMPACT_LABELS[imp - 1]} ({imp})
            </p>
            <p className="text-gray-400 mt-0.5">
              Score: {l * imp} · {cell?.count || 0} risk{(cell?.count || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
