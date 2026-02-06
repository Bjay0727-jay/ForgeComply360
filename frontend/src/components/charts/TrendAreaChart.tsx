// ============================================================================
// TrendAreaChart — Compliance trend line with gradient fill
// Replaces hand-coded SVG line charts on Dashboard & Monitoring
// ============================================================================

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useChartColors, ANIMATION, getChartColors } from '../../utils/chartTheme';
import { useTheme } from '../../hooks/useTheme';

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendAreaChartProps {
  data: TrendDataPoint[];
  height?: number;
  valueLabel?: string;
  valueSuffix?: string;
  showGrid?: boolean;
  minY?: number;
  maxY?: number;
}

function CustomTooltip({ active, payload, label, valueLabel, valueSuffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-700">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-sm">
        {valueLabel || 'Score'}: {payload[0].value}{valueSuffix || '%'}
      </p>
    </div>
  );
}

export function TrendAreaChart({
  data,
  height = 240,
  valueLabel = 'Compliance',
  valueSuffix = '%',
  showGrid = true,
  minY,
  maxY,
}: TrendAreaChartProps) {
  const { primary, primaryLight, gradient } = useChartColors();
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);
  const gradientId = `trendGrad-${primary.replace('#', '')}`;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No trend data available yet.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const yMin = minY ?? Math.max(0, Math.min(...values) - 10);
  const yMax = maxY ?? Math.min(100, Math.max(...values) + 10);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryLight} stopOpacity={0.35} />
            <stop offset="100%" stopColor={primaryLight} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        )}
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: colors.axisText }}
          axisLine={{ stroke: colors.grid }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 11, fill: colors.axisText }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
          width={45}
        />
        <Tooltip
          content={<CustomTooltip valueLabel={valueLabel} valueSuffix={valueSuffix} />}
          cursor={{ stroke: primaryLight, strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={primary}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: primary, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: primaryLight, stroke: colors.dotStroke, strokeWidth: 2 }}
          animationDuration={ANIMATION.duration}
          animationEasing="ease-in-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
