// ============================================================================
// HorizontalBarList — Labeled horizontal bars for scores, gaps, summaries
// Replaces CSS progress bars across Dashboard (Score Breakdown, Gap Analysis)
// ============================================================================

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { scoreToColor, STATUS_COLORS, ANIMATION, getChartColors } from '../../utils/chartTheme';
import { useTheme } from '../../hooks/useTheme';

interface BarItem {
  name: string;
  value: number;
  color?: string;
  maxValue?: number;
  suffix?: string;
  icon?: React.ReactNode;
  sublabel?: string;
}

interface HorizontalBarListProps {
  data: BarItem[];
  height?: number;
  maxValue?: number;
  colorByScore?: boolean;
  barColor?: string;
  showValues?: boolean;
  onBarClick?: (item: BarItem) => void;
  barSize?: number;
  animate?: boolean;
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900/95 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-700">
      <p className="font-semibold">{d.name}</p>
      {d.sublabel && <p className="text-gray-400">{d.sublabel}</p>}
      <p className="mt-1">{d.value}{d.suffix || ''}</p>
    </div>
  );
}

export function HorizontalBarList({
  data,
  height,
  maxValue,
  colorByScore = false,
  barColor,
  showValues = true,
  onBarClick,
  barSize = 20,
  animate = true,
}: HorizontalBarListProps) {
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);
  const computedMax = maxValue || Math.max(...data.map((d) => d.maxValue || d.value), 1);
  const computedHeight = height || Math.max(data.length * 46 + 20, 120);

  return (
    <ResponsiveContainer width="100%" height={computedHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: showValues ? 50 : 10, bottom: 4, left: 10 }}
        barCategoryGap="20%"
      >
        <XAxis
          type="number"
          domain={[0, computedMax]}
          hide
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 12, fill: colors.labelText, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: colors.tooltipCursor }} />
        <Bar
          dataKey="value"
          radius={[0, 6, 6, 0]}
          barSize={barSize}
          animationDuration={animate ? ANIMATION.duration : 0}
          animationEasing="ease-in-out"
          onClick={onBarClick ? (_: any, idx: number) => onBarClick(data[idx]) : undefined}
          style={onBarClick ? { cursor: 'pointer' } : undefined}
          label={
            showValues
              ? {
                  position: 'right' as const,
                  fill: colors.labelText,
                  fontSize: 13,
                  fontWeight: 700,
                  formatter: (v: any) => {
                    const val = typeof v === 'number' ? v : Number(v);
                    const item = data.find((d) => d.value === val);
                    return `${val}${item?.suffix || ''}`;
                  },
                }
              : false
          }
        >
          {data.map((item, i) => (
            <Cell
              key={i}
              fill={
                item.color ||
                (colorByScore ? scoreToColor(item.value) : barColor || STATUS_COLORS.info)
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
