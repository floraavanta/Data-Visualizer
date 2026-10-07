import React, { useState, useRef } from 'react';
import { DataRow } from '../../types/data';
import { ChartTooltip } from './Tooltip';
import { formatMetricNumber } from '../../utils/parser';

interface ScatterChartProps {
  rows: DataRow[];
  xCol: string;
  yCol: string;
  labelCol?: string;
  sizeCol?: string;
  colors: string[];
  height?: number;
}

export const ScatterChart: React.FC<ScatterChartProps> = ({
  rows,
  xCol,
  yCol,
  labelCol,
  sizeCol,
  colors,
  height = 320,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Filter valid numeric pairs
  const points = rows
    .map((row, originalIdx) => {
      const rawX = row[xCol];
      const rawY = row[yCol];
      const numX = typeof rawX === 'number' ? rawX : Number(String(rawX).replace(/[^0-9.-]/g, ''));
      const numY = typeof rawY === 'number' ? rawY : Number(String(rawY).replace(/[^0-9.-]/g, ''));
      const rawSize = sizeCol ? row[sizeCol] : null;
      const numSize = typeof rawSize === 'number' ? rawSize : 10;
      const label = labelCol ? String(row[labelCol] || `Point ${originalIdx + 1}`) : `Record #${originalIdx + 1}`;

      return {
        x: numX,
        y: numY,
        sizeVal: isNaN(numSize) ? 10 : numSize,
        label,
        row,
      };
    })
    .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));

  if (points.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-400">
        Requires two numeric columns to render scatter plot
      </div>
    );
  }

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x)) || 1;
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y)) || 1;

  // Add 10% breathing room
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;
  const effectiveMinX = minX - xSpan * 0.05;
  const effectiveMaxX = maxX + xSpan * 0.05;
  const effectiveMinY = Math.min(0, minY - ySpan * 0.05);
  const effectiveMaxY = maxY + ySpan * 0.05;

  const padding = { top: 20, right: 24, bottom: 44, left: 60 };
  const width = 700;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getPixelX = (val: number) => {
    return padding.left + ((val - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * chartWidth;
  };

  const getPixelY = (val: number) => {
    return padding.top + chartHeight - ((val - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * chartHeight;
  };

  // Regression trendline
  let trendSlope = 0;
  let trendIntercept = 0;
  if (points.length > 1) {
    const n = points.length;
    const sumX = points.reduce((acc, p) => acc + p.x, 0);
    const sumY = points.reduce((acc, p) => acc + p.y, 0);
    const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom !== 0) {
      trendSlope = (n * sumXY - sumX * sumY) / denom;
      trendIntercept = (sumY - trendSlope * sumX) / n;
    }
  }

  const trendStart = {
    x: getPixelX(effectiveMinX),
    y: getPixelY(trendSlope * effectiveMinX + trendIntercept),
  };
  const trendEnd = {
    x: getPixelX(effectiveMaxX),
    y: getPixelY(trendSlope * effectiveMaxX + trendIntercept),
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const yVal = effectiveMinY + (effectiveMaxY - effectiveMinY) * pct;
          const y = getPixelY(yVal);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono tabular-nums"
              >
                {formatMetricNumber(yVal)}
              </text>
            </g>
          );
        })}

        {/* Trendline */}
        {points.length > 2 && (
          <line
            x1={trendStart.x}
            y1={trendStart.y}
            x2={trendEnd.x}
            y2={trendEnd.y}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            opacity={0.7}
          />
        )}

        {/* Scatter Points */}
        {points.map((pt, idx) => {
          const cx = getPixelX(pt.x);
          const cy = getPixelY(pt.y);
          const isHovered = hoveredIdx === idx;
          const radius = sizeCol ? Math.max(5, Math.min(18, pt.sizeVal / 10)) : 6;
          const color = colors[idx % colors.length];

          return (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                setTooltipPos({
                  x: (cx / width) * rect.width,
                  y: (cy / height) * rect.height,
                });
                setHoveredIdx(idx);
              }}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? radius + 3 : radius}
                fill={color}
                fillOpacity={isHovered ? 0.9 : 0.65}
                stroke={color}
                strokeWidth={1.5}
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {/* X Axis label */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 8}
          textAnchor="middle"
          className="text-[11px] fill-slate-500 font-medium"
        >
          {xCol}
        </text>

        {/* Y Axis label */}
        <text
          x={16}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 16 ${padding.top + chartHeight / 2})`}
          className="text-[11px] fill-slate-500 font-medium"
        >
          {yCol}
        </text>
      </svg>

      {/* Tooltip */}
      {activePoint && (
        <ChartTooltip
          x={tooltipPos.x}
          y={tooltipPos.y}
          title={activePoint.label}
          visible={hoveredIdx !== null}
          items={[
            { label: xCol, value: formatMetricNumber(activePoint.x) },
            { label: yCol, value: formatMetricNumber(activePoint.y) },
            ...(sizeCol ? [{ label: sizeCol, value: formatMetricNumber(activePoint.sizeVal) }] : []),
          ]}
        />
      )}
    </div>
  );
};
