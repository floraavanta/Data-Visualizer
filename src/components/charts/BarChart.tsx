import React, { useState, useRef } from 'react';
import { AggregatedDataPoint } from '../../types/data';
import { ChartTooltip } from './Tooltip';
import { formatMetricNumber } from '../../utils/parser';

interface BarChartProps {
  data: AggregatedDataPoint[];
  metricName: string;
  isCurrency?: boolean;
  colors: string[];
  stacked?: boolean;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  metricName,
  isCurrency = false,
  colors,
  stacked = false,
  height = 320,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No data available to display
      </div>
    );
  }

  // Check if grouped data exists
  const allGroups = Array.from(
    new Set(data.flatMap(d => (d.groupBreakdown ? Object.keys(d.groupBreakdown) : [])))
  );
  const hasGroups = allGroups.length > 1;

  // Calculate scales
  let maxValue = 0;
  if (hasGroups && stacked) {
    maxValue = Math.max(...data.map(d => {
      if (!d.groupBreakdown) return d.value;
      return Object.values(d.groupBreakdown).reduce((a, b) => a + b, 0);
    }), 1);
  } else if (hasGroups) {
    maxValue = Math.max(...data.flatMap(d => {
      if (!d.groupBreakdown) return [d.value];
      return Object.values(d.groupBreakdown);
    }), 1);
  } else {
    maxValue = Math.max(...data.map(d => d.value), 1);
  }

  // Padding
  const padding = { top: 20, right: 24, bottom: 50, left: 60 };
  const width = 700;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i);

  const bandWidth = chartWidth / data.length;
  const barPadding = bandWidth * 0.25;
  const usableWidth = bandWidth - barPadding;

  const handleMouseMove = (e: React.MouseEvent, idx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredIdx(idx);
  };

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {hasGroups && (
        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-slate-600">
          {allGroups.map((group, idx) => (
            <div key={group} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="font-medium text-slate-700">{group}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        {/* Horizontal gridlines */}
        {yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? 'none' : '3 3'}
                strokeWidth={1}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono tabular-nums"
              >
                {formatMetricNumber(tick, isCurrency)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const xCenter = padding.left + i * bandWidth + bandWidth / 2;
          const isHovered = hoveredIdx === i;

          if (hasGroups && stacked && d.groupBreakdown) {
            let currentBottom = 0;
            const groupEntries = Object.entries(d.groupBreakdown);

            return (
              <g
                key={i}
                onMouseMove={(e) => handleMouseMove(e, i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Background hover highlight */}
                <rect
                  x={xCenter - bandWidth / 2}
                  y={padding.top}
                  width={bandWidth}
                  height={chartHeight}
                  fill={isHovered ? 'rgba(241, 245, 249, 0.6)' : 'transparent'}
                />

                {groupEntries.map(([groupName, val], gIdx) => {
                  const barH = (val / maxValue) * chartHeight;
                  const y = padding.top + chartHeight - currentBottom - barH;
                  currentBottom += barH;
                  const color = colors[allGroups.indexOf(groupName) % colors.length];

                  return (
                    <rect
                      key={groupName}
                      x={xCenter - usableWidth / 2}
                      y={y}
                      width={usableWidth}
                      height={Math.max(barH, 0)}
                      fill={color}
                      rx={gIdx === groupEntries.length - 1 ? 3 : 0}
                      className="transition-all duration-150"
                      opacity={isHovered ? 1 : 0.9}
                    />
                  );
                })}
              </g>
            );
          }

          if (hasGroups && !stacked && d.groupBreakdown) {
            const subBarWidth = usableWidth / allGroups.length;

            return (
              <g
                key={i}
                onMouseMove={(e) => handleMouseMove(e, i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={xCenter - bandWidth / 2}
                  y={padding.top}
                  width={bandWidth}
                  height={chartHeight}
                  fill={isHovered ? 'rgba(241, 245, 249, 0.6)' : 'transparent'}
                />
                {allGroups.map((gName, gIdx) => {
                  const val = d.groupBreakdown?.[gName] || 0;
                  const barH = (val / maxValue) * chartHeight;
                  const x = xCenter - usableWidth / 2 + gIdx * subBarWidth;
                  const y = padding.top + chartHeight - barH;
                  const color = colors[gIdx % colors.length];

                  return (
                    <rect
                      key={gName}
                      x={x + 1}
                      y={y}
                      width={Math.max(subBarWidth - 2, 2)}
                      height={Math.max(barH, 0)}
                      fill={color}
                      rx={2}
                      opacity={isHovered ? 1 : 0.85}
                    />
                  );
                })}
              </g>
            );
          }

          // Single bar
          const barH = (d.value / maxValue) * chartHeight;
          const x = xCenter - usableWidth / 2;
          const y = padding.top + chartHeight - barH;
          const color = colors[i % colors.length];

          return (
            <g
              key={i}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={xCenter - bandWidth / 2}
                y={padding.top}
                width={bandWidth}
                height={chartHeight}
                fill={isHovered ? 'rgba(241, 245, 249, 0.6)' : 'transparent'}
              />
              <rect
                x={x}
                y={y}
                width={usableWidth}
                height={Math.max(barH, 0)}
                fill={color}
                rx={3}
                className="transition-all duration-150"
                opacity={isHovered ? 1 : 0.88}
              />
            </g>
          );
        })}

        {/* X Axis labels */}
        {data.map((d, i) => {
          const x = padding.left + i * bandWidth + bandWidth / 2;
          const y = padding.top + chartHeight + 18;
          const truncateLabel = d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label;

          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[11px] fill-slate-500 font-medium select-none"
            >
              {truncateLabel}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {activePoint && (
        <ChartTooltip
          x={tooltipPos.x}
          y={tooltipPos.y}
          title={activePoint.label}
          visible={hoveredIdx !== null}
          items={
            activePoint.groupBreakdown && Object.keys(activePoint.groupBreakdown).length > 0
              ? Object.entries(activePoint.groupBreakdown).map(([group, val]) => ({
                  label: group,
                  value: formatMetricNumber(val, isCurrency),
                  color: colors[allGroups.indexOf(group) % colors.length],
                }))
              : [
                  {
                    label: metricName,
                    value: formatMetricNumber(activePoint.value, isCurrency),
                    color: colors[hoveredIdx! % colors.length],
                  },
                  {
                    label: 'Records',
                    value: activePoint.count.toString(),
                  },
                ]
          }
        />
      )}
    </div>
  );
};
