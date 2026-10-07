import React, { useState } from 'react';
import { AggregatedDataPoint } from '../../types/data';
import { formatMetricNumber } from '../../utils/parser';

interface DonutChartProps {
  data: AggregatedDataPoint[];
  metricName: string;
  isCurrency?: boolean;
  colors: string[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  metricName,
  isCurrency = false,
  colors,
  size = 300,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-sm text-slate-400">No data available</div>;
  }

  // Filter positive items
  const validItems = data.filter(d => d.value > 0);
  const total = validItems.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return <div className="text-center py-12 text-sm text-slate-400">Values are all zero</div>;
  }

  const center = size / 2;
  const outerRadius = size * 0.42;
  const innerRadius = size * 0.27;

  // Compute angles
  let currentAngle = -Math.PI / 2; // start from top (12 o'clock)
  const slices = validItems.map((item, idx) => {
    const fraction = item.value / total;
    const angle = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const isHovered = hoveredIdx === idx;
    const rOut = isHovered ? outerRadius + 4 : outerRadius;
    const rIn = isHovered ? innerRadius - 2 : innerRadius;

    // SVG arc path
    const x1 = center + rOut * Math.cos(startAngle);
    const y1 = center + rOut * Math.sin(startAngle);
    const x2 = center + rOut * Math.cos(endAngle);
    const y2 = center + rOut * Math.sin(endAngle);

    const x3 = center + rIn * Math.cos(endAngle);
    const y3 = center + rIn * Math.sin(endAngle);
    const x4 = center + rIn * Math.cos(startAngle);
    const y4 = center + rIn * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;

    return {
      ...item,
      fraction,
      percentage: (fraction * 100).toFixed(1),
      pathData,
      color: colors[idx % colors.length],
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 w-full">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible select-none">
          {slices.map((slice, idx) => (
            <path
              key={slice.label}
              d={slice.pathData}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth={2}
              className="transition-all duration-200 cursor-pointer"
              opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.65}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate max-w-[110px]">
            {activeSlice ? activeSlice.label : 'Total ' + metricName}
          </span>
          <span className="font-mono tabular-nums text-lg font-bold text-slate-800">
            {formatMetricNumber(activeSlice ? activeSlice.value : total, isCurrency)}
          </span>
          {activeSlice && (
            <span className="text-[11px] font-mono text-indigo-600 font-semibold">
              {activeSlice.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex-1 w-full max-h-[280px] overflow-y-auto pr-2 space-y-2">
        {slices.map((slice, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <button
              type="button"
              key={slice.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`w-full flex items-center justify-between text-left p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="font-medium text-slate-700 truncate">{slice.label}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-400 font-mono tabular-nums text-[11px]">
                  {slice.percentage}%
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatMetricNumber(slice.value, isCurrency)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
