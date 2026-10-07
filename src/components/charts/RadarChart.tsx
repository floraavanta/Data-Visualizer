import React, { useState } from 'react';
import { AggregatedDataPoint } from '../../types/data';
import { formatMetricNumber } from '../../utils/parser';

interface RadarChartProps {
  data: AggregatedDataPoint[];
  metricName: string;
  isCurrency?: boolean;
  colors: string[];
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  metricName,
  isCurrency = false,
  colors,
  size = 320,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length < 3) {
    return (
      <div className="text-center py-12 text-sm text-slate-400">
        Radar chart requires at least 3 categories to construct polygon web
      </div>
    );
  }

  const items = data.slice(0, 8); // max 8 for clean spider polygon
  const maxValue = Math.max(...items.map(d => d.value), 1);
  const center = size / 2;
  const radius = size * 0.38;
  const numAxes = items.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Grid levels (3 concentric rings)
  const levels = [0.33, 0.66, 1.0];

  // Axis lines and polygon vertex points
  const points = items.map((item, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const distance = (item.value / maxValue) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
      labelX: center + (radius + 20) * Math.cos(angle),
      labelY: center + (radius + 20) * Math.sin(angle),
      item,
      angle,
    };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Concentric spider rings */}
        {levels.map((level, lvlIdx) => {
          const ringPoints = Array.from({ length: numAxes }, (_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = radius * level;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');

          return (
            <g key={lvlIdx}>
              <polygon
                points={ringPoints}
                fill={lvlIdx === levels.length - 1 ? '#f8fafc' : 'none'}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={center + 4}
                y={center - radius * level - 2}
                className="text-[9px] fill-slate-400 font-mono"
              >
                {formatMetricNumber(maxValue * level, isCurrency)}
              </text>
            </g>
          );
        })}

        {/* Axis spokes */}
        {points.map((p, i) => {
          const spokeX = center + radius * Math.cos(p.angle);
          const spokeY = center + radius * Math.sin(p.angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={spokeX}
              y2={spokeY}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon filled shape */}
        <path
          d={polygonPath}
          fill={colors[0]}
          fillOpacity={0.25}
          stroke={colors[0]}
          strokeWidth={2}
          className="transition-all duration-300"
        />

        {/* Data points */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isHovered ? 6 : 4}
              fill="#ffffff"
              stroke={colors[0]}
              strokeWidth={2}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {/* Axis labels */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <text
              key={i}
              x={p.labelX}
              y={p.labelY}
              textAnchor={p.labelX > center + 5 ? 'start' : p.labelX < center - 5 ? 'end' : 'middle'}
              dominantBaseline="middle"
              className={`text-[10px] font-medium transition-colors ${
                isHovered ? 'fill-indigo-600 font-semibold' : 'fill-slate-600'
              }`}
            >
              {p.item.label.length > 11 ? p.item.label.slice(0, 10) + '…' : p.item.label}
            </text>
          );
        })}
      </svg>

      {hoveredIdx !== null && (
        <div className="mt-2 text-center text-xs">
          <span className="text-slate-500 font-medium">{points[hoveredIdx].item.label}: </span>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {formatMetricNumber(points[hoveredIdx].item.value, isCurrency)} {metricName}
          </span>
        </div>
      )}
    </div>
  );
};
