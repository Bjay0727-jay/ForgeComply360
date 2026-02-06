// ============================================================================
// MetricCard — Dark stat card with optional mini sparkline
// Replaces basic MetricCard and stat displays across Dashboard, Monitoring
// ============================================================================

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useChartColors } from '../../utils/chartTheme';
import { useTheme } from '../../hooks/useTheme';

interface SparkPoint {
  value: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: number; label?: string };
  sparkData?: SparkPoint[];
  accentColor?: string;
  icon?: React.ReactNode;
  href?: string;
  dark?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  sparkData,
  accentColor,
  icon,
  href,
  dark: darkProp = true,
}: MetricCardProps) {
  const { isDark } = useTheme();
  const dark = isDark;
  const { primaryLight } = useChartColors();
  const accent = accentColor || primaryLight;

  const content = (
    <div
      className={`rounded-xl border p-4 relative overflow-hidden transition-shadow hover:shadow-lg ${
        dark
          ? 'bg-gray-700 border-blue-500/60 text-white'
          : 'bg-white border-blue-300 text-gray-900'
      }`}
    >
      {/* Accent bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-1 ${dark ? 'text-white/80' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
          {subtitle && (
            <p className={`text-xs mt-1 ${dark ? 'text-white/70' : 'text-gray-400'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <span
                className={`text-xs font-semibold ${
                  trend.value > 0
                    ? 'text-green-400'
                    : trend.value < 0
                    ? 'text-red-400'
                    : dark
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'}{' '}
                {Math.abs(trend.value)}
                {trend.label || ' pts'}
              </span>
            </div>
          )}
        </div>

        {/* Right side: icon or sparkline */}
        <div className="flex flex-col items-end gap-1">
          {icon && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${accent}20` }}
            >
              {icon}
            </div>
          )}
          {sparkData && sparkData.length >= 2 && (
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={accent}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block group">
        {content}
      </a>
    );
  }

  return content;
}
