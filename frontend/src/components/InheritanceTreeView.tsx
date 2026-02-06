import React, { useState, useMemo } from 'react';

interface InheritanceNode {
  id: string;
  name: string;
  type: 'provider' | 'consumer' | 'both' | 'standalone';
  native_controls: number;
  inherited_controls: number;
  provided_controls: number;
}

interface InheritanceEdge {
  source: string;
  target: string;
  control_count: number;
  families: string[];
  statuses: Record<string, number>;
  controls: string[];
}

interface InheritanceSummary {
  total_systems: number;
  providers: number;
  consumers: number;
  total_inherited: number;
  total_edges: number;
}

interface InheritanceTreeViewProps {
  nodes: InheritanceNode[];
  edges: InheritanceEdge[];
  summary: InheritanceSummary;
  onSyncInheritance?: (sourceId: string, targetId: string) => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 72;
const ROW_GAP = 140;
const COL_GAP = 40;
const PADDING = 40;

const TYPE_COLORS: Record<string, { fill: string; stroke: string; text: string; label: string }> = {
  provider:   { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e40af', label: 'Provider' },
  consumer:   { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46', label: 'Consumer' },
  both:       { fill: '#f5f3ff', stroke: '#8b5cf6', text: '#5b21b6', label: 'Both' },
  standalone: { fill: '#f9fafb', stroke: '#9ca3af', text: '#374151', label: 'Standalone' },
};

interface PositionedNode {
  node: InheritanceNode;
  x: number;
  y: number;
}

function computeLayout(nodes: InheritanceNode[]): {
  positioned: PositionedNode[];
  svgWidth: number;
  svgHeight: number;
} {
  const providers = nodes.filter((n) => n.type === 'provider');
  const consumers = nodes.filter((n) => n.type === 'consumer');
  const both = nodes.filter((n) => n.type === 'both');
  const standalone = nodes.filter((n) => n.type === 'standalone');

  const rows: InheritanceNode[][] = [];
  if (providers.length > 0) rows.push(providers);
  if (both.length > 0) rows.push(both);
  if (consumers.length > 0) rows.push(consumers);
  if (standalone.length > 0) rows.push(standalone);

  if (rows.length === 0) {
    return { positioned: [], svgWidth: 400, svgHeight: 200 };
  }

  const maxCols = Math.max(...rows.map((r) => r.length));
  const svgWidth = Math.max(400, maxCols * (NODE_WIDTH + COL_GAP) - COL_GAP + PADDING * 2);
  const svgHeight = rows.length * (NODE_HEIGHT + ROW_GAP) - ROW_GAP + PADDING * 2;

  const positioned: PositionedNode[] = [];

  rows.forEach((row, rowIdx) => {
    const totalRowWidth = row.length * NODE_WIDTH + (row.length - 1) * COL_GAP;
    const startX = (svgWidth - totalRowWidth) / 2;
    const y = PADDING + rowIdx * (NODE_HEIGHT + ROW_GAP);

    row.forEach((node, colIdx) => {
      positioned.push({
        node,
        x: startX + colIdx * (NODE_WIDTH + COL_GAP),
        y,
      });
    });
  });

  return { positioned, svgWidth, svgHeight };
}

function buildEdgePath(
  sourcePos: PositionedNode,
  targetPos: PositionedNode
): { path: string; labelX: number; labelY: number } {
  const sx = sourcePos.x + NODE_WIDTH / 2;
  const sy = sourcePos.y + NODE_HEIGHT;
  const tx = targetPos.x + NODE_WIDTH / 2;
  const ty = targetPos.y;

  const midY = (sy + ty) / 2;
  const path = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
  const labelX = (sx + tx) / 2;
  const labelY = midY;

  return { path, labelX, labelY };
}

export function InheritanceTreeView({
  nodes,
  edges,
  summary,
  onSyncInheritance,
}: InheritanceTreeViewProps) {
  const [selectedEdge, setSelectedEdge] = useState<InheritanceEdge | null>(null);

  const { positioned, svgWidth, svgHeight } = useMemo(() => computeLayout(nodes), [nodes]);

  const posMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    positioned.forEach((p) => map.set(p.node.id, p));
    return map;
  }, [positioned]);

  const summaryCards = [
    { label: 'Providers', value: summary.providers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Consumers', value: summary.consumers, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Inherited Controls', value: summary.total_inherited, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { label: 'Connections', value: summary.total_edges, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
  ];

  const sourceNode = selectedEdge ? nodes.find((n) => n.id === selectedEdge.source) : null;
  const targetNode = selectedEdge ? nodes.find((n) => n.id === selectedEdge.target) : null;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-4`}
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* SVG Diagram or Empty State */}
      {edges.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-600">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-100">
            No inheritance relationships configured.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
            Set up control inheritance in the Controls page.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            height={svgHeight}
            className="min-w-[400px]"
            role="img"
            aria-label="Inheritance tree diagram"
          >
            {/* Edge paths */}
            {edges.map((edge) => {
              const sourcePos = posMap.get(edge.source);
              const targetPos = posMap.get(edge.target);
              if (!sourcePos || !targetPos) return null;

              const { path, labelX, labelY } = buildEdgePath(sourcePos, targetPos);
              const isSelected =
                selectedEdge?.source === edge.source && selectedEdge?.target === edge.target;

              return (
                <g
                  key={`${edge.source}-${edge.target}`}
                  className="cursor-pointer"
                  onClick={() => setSelectedEdge(isSelected ? null : edge)}
                >
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelected ? '#6366f1' : '#94a3b8'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isSelected ? 'none' : '6 3'}
                    markerEnd="url(#arrowhead)"
                  />
                  {/* Invisible wider path for easier click target */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                  />
                  {/* Edge label */}
                  <rect
                    x={labelX - 18}
                    y={labelY - 11}
                    width={36}
                    height={22}
                    rx={11}
                    fill={isSelected ? '#6366f1' : '#f1f5f9'}
                    stroke={isSelected ? '#6366f1' : '#cbd5e1'}
                    strokeWidth={1}
                  />
                  <text
                    x={labelX}
                    y={labelY + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={isSelected ? '#ffffff' : '#475569'}
                  >
                    {edge.control_count}
                  </text>
                </g>
              );
            })}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
            </defs>

            {/* Nodes */}
            {positioned.map(({ node, x, y }) => {
              const colors = TYPE_COLORS[node.type] || TYPE_COLORS.standalone;
              return (
                <g key={node.id}>
                  <rect
                    x={x}
                    y={y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={10}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={1.5}
                  />
                  {/* Type badge */}
                  <rect
                    x={x + 8}
                    y={y + 6}
                    width={colors.label.length * 7 + 10}
                    height={16}
                    rx={8}
                    fill={colors.stroke}
                    opacity={0.15}
                  />
                  <text
                    x={x + 13}
                    y={y + 17}
                    fontSize={9}
                    fontWeight={600}
                    fill={colors.stroke}
                  >
                    {colors.label}
                  </text>
                  {/* System name */}
                  <text
                    x={x + NODE_WIDTH / 2}
                    y={y + 38}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={700}
                    fill={colors.text}
                  >
                    {node.name.length > 18 ? node.name.slice(0, 17) + '\u2026' : node.name}
                  </text>
                  {/* Counts */}
                  <text
                    x={x + NODE_WIDTH / 2}
                    y={y + 56}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6b7280"
                  >
                    {node.native_controls}N / {node.inherited_controls}I / {node.provided_controls}P
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Edge detail panel */}
      {selectedEdge && sourceNode && targetNode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {sourceNode.name}
                </span>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                  {targetNode.name}
                </span>
              </h3>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {/* Control count */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Controls
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {selectedEdge.control_count}
                  </p>
                </div>

                {/* Families */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Families
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEdge.families.length > 0 ? (
                      selectedEdge.families.map((fam) => (
                        <span
                          key={fam}
                          className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300"
                        >
                          {fam}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </div>
                </div>

                {/* Status breakdown */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Status Breakdown
                  </p>
                  <div className="space-y-1">
                    {Object.keys(selectedEdge.statuses).length > 0 ? (
                      Object.entries(selectedEdge.statuses).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between text-xs">
                          <span className="capitalize text-gray-600 dark:text-gray-300">{status}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No status data</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onSyncInheritance && (
                <button
                  onClick={() => onSyncInheritance(selectedEdge.source, selectedEdge.target)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Sync from Source
                </button>
              )}
              <button
                onClick={() => setSelectedEdge(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close detail panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
