import React, { useState, useRef } from 'react';
import { AggregatedDataPoint } from '../../types/data';
import { ChartTooltip } from './Tooltip';
import { formatMetricNumber } from '../../utils/parser';

interface LineChartProps {
  data: AggregatedDataPoint[];
  metricName: string;
  isCurrency?: boolean;
  colors: string[];
  area?: boolean;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  metricName,
  isCurrency = false,
  colors,
  area = false,
  height = 320,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-sm text-slate-400">No data available</div>;
  }

  // Check if multiple groups exist
  const allGroups = Array.from(
    new Set(data.flatMap(d => (d.groupBreakdown ? Object.keys(d.groupBreakdown) : [])))
  );
  const hasGroups = allGroups.length > 1;

  let maxValue = 0;
  if (hasGroups) {
    maxValue = Math.max(...data.flatMap(d => (d.groupBreakdown ? Object.values(d.groupBreakdown) : [d.value])), 1);
  } else {
    maxValue = Math.max(...data.map(d => d.value), 1);
  }

  const padding = { top: 20, right: 24, bottom: 44, left: 60 };
  const width = 700;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i);

  const getX = (index: number) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxValue) * chartHeight;
  };

  // Helper to build smooth cubic curve path
  const buildSmoothPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find nearest point
    const relativeX = (mouseX / rect.width) * width;
    let closestIdx = 0;
    let minDist = Infinity;

    data.forEach((_, idx) => {
      const ptX = getX(idx);
      const dist = Math.abs(ptX - relativeX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    setHoveredIdx(closestIdx);
    setTooltipPos({
      x: (getX(closestIdx) / width) * rect.width,
      y: mouseY,
    });
  };

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
      className="relative w-full select-none cursor-crosshair"
    >
      {hasGroups && (
        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-slate-600">
          {allGroups.map((group, idx) => (
            <div key={group} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
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
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
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

        {/* Hover vertical guideline */}
        {hoveredIdx !== null && (
          <line
            x1={getX(hoveredIdx)}
            y1={padding.top}
            x2={getX(hoveredIdx)}
            y2={padding.top + chartHeight}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
        )}

        {/* Multi-group lines or single line */}
        {hasGroups ? (
          allGroups.map((group, gIdx) => {
            const pts = data.map((d, i) => ({
              x: getX(i),
              y: getY(d.groupBreakdown?.[group] || 0),
            }));
            const linePath = buildSmoothPath(pts);
            const color = colors[gIdx % colors.length];

            return (
              <g key={group}>
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {hoveredIdx !== null && (
                  <circle
                    cx={pts[hoveredIdx].x}
                    cy={pts[hoveredIdx].y}
                    r={5}
                    fill="#ffffff"
                    stroke={color}
                    strokeWidth={2.5}
                  />
                )}
              </g>
            );
          })
        ) : (
          (() => {
            const pts = data.map((d, i) => ({
              x: getX(i),
              y: getY(d.value),
            }));
            const linePath = buildSmoothPath(pts);
            const areaPath =
              linePath +
              ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${
                padding.top + chartHeight
              } Z`;

            return (
              <g>
                {area && <path d={areaPath} fill="url(#lineAreaGradient)" />}
                <path
                  d={linePath}
                  fill="none"
                  stroke={colors[0]}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((_, i) => (
                  <circle
                    key={i}
                    cx={pts[i].x}
                    cy={pts[i].y}
                    r={hoveredIdx === i ? 6 : 3}
                    fill="#ffffff"
                    stroke={colors[0]}
                    strokeWidth={2}
                    className="transition-all duration-150"
                  />
                ))}
              </g>
            );
          })()
        )}

        {/* X Axis labels */}
        {data.map((d, i) => {
          // If too many items, sample labels
          if (data.length > 12 && i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) {
            return null;
          }
          const x = getX(i);
          const y = padding.top + chartHeight + 18;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[11px] fill-slate-500 font-medium select-none"
            >
              {d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}
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
            hasGroups && activePoint.groupBreakdown
              ? Object.entries(activePoint.groupBreakdown).map(([group, val]) => ({
                  label: group,
                  value: formatMetricNumber(val, isCurrency),
                  color: colors[allGroups.indexOf(group) % colors.length],
                }))
              : [
                  {
                    label: metricName,
                    value: formatMetricNumber(activePoint.value, isCurrency),
                    color: colors[0],
                  },
                ]
          }
        />
      )}
    </div>
  );
};
