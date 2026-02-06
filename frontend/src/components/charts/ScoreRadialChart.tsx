// ============================================================================
// ScoreRadialChart — Donut/radial score display
// Replaces hand-coded SVG donuts across Dashboard, Monitoring, Vendors, Audit
// ============================================================================

import React from 'react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { scoreToColor, GRADE_COLORS, ANIMATION, getChartColors } from '../../utils/chartTheme';
import { useTheme } from '../../hooks/useTheme';

interface ScoreRadialChartProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
  grade?: string;
  thickness?: number;
  showLabel?: boolean;
  className?: string;
}

export function ScoreRadialChart({
  score,
  maxScore = 100,
  size = 180,
  label,
  grade,
  thickness = 12,
  showLabel = true,
  className = '',
}: ScoreRadialChartProps) {
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;
  const pct = maxScore > 0 ? Math.round((safeScore / maxScore) * 100) : 0;
  const fillColor = grade ? (GRADE_COLORS[grade] || scoreToColor(pct)) : scoreToColor(pct);

  const data = [{ name: 'score', value: pct, fill: fillColor }];

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={`${100 - (thickness / size) * 200}%`}
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={thickness}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: colors.background }}
            dataKey="value"
            cornerRadius={thickness / 2}
            animationDuration={ANIMATION.duration}
            animationEasing="ease-in-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center label overlay */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {grade ? (
            <>
              <span
                className="text-3xl font-bold leading-none"
                style={{ color: fillColor }}
              >
                {grade}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{pct}%</span>
            </>
          ) : (
            <>
              <span
                className="text-2xl font-bold leading-none"
                style={{ color: fillColor }}
              >
                {pct}%
              </span>
              {label && (
                <span className="text-[10px] text-gray-500 mt-0.5 max-w-[70%] text-center truncate">
                  {label}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
