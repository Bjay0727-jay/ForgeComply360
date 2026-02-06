// ============================================================================
// StackedStatusBar — Horizontal stacked bar for status distributions
// Replaces CSS bars for Control Implementation, POA&M Summary
// ============================================================================

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { ANIMATION } from '../../utils/chartTheme';

interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface StackedStatusBarProps {
  segments: Segment[];
  height?: number;
  showLegend?: boolean;
  showValues?: boolean;
  barSize?: number;
}

function StackedTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
  return (
    <div className="bg-gray-900/95 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-700 min-w-[140px]">
      {payload.map((p: any) => {
        const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
              <span>{p.name}</span>
            </div>
            <span className="font-semibold">{p.value} ({pct}%)</span>
          </div>
        );
      })}
      <div className="border-t border-gray-600 mt-1 pt-1 flex justify-between font-semibold">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
      {payload?.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StackedStatusBar({
  segments,
  height = 64,
  showLegend = true,
  barSize = 28,
}: StackedStatusBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No data available.
      </div>
    );
  }

  // Recharts needs a single data row with each segment as a key
  const chartData = [
    segments.reduce((obj, s) => ({ ...obj, [s.key]: s.value }), { name: 'status' }),
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" domain={[0, total]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip content={<StackedTooltip />} cursor={false} />
          {segments.map((seg, i) => (
            <Bar
              key={seg.key}
              dataKey={seg.key}
              stackId="status"
              fill={seg.color}
              name={seg.label}
              barSize={barSize}
              radius={
                i === 0 && segments.length === 1
                  ? [6, 6, 6, 6]
                  : i === 0
                  ? [6, 0, 0, 6]
                  : i === segments.length - 1
                  ? [0, 6, 6, 0]
                  : [0, 0, 0, 0]
              }
              animationDuration={ANIMATION.duration}
              animationEasing="ease-in-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {showLegend && (
        <CustomLegend
          payload={segments.map((s) => ({ value: s.label, color: s.color }))}
        />
      )}
    </div>
  );
}
