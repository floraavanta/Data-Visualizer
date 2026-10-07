import React, { useState } from 'react';
import { AggregatedDataPoint } from '../../types/data';
import { formatMetricNumber } from '../../utils/parser';

interface HorizontalBarChartProps {
  data: AggregatedDataPoint[];
  metricName: string;
  isCurrency?: boolean;
  colors: string[];
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  metricName,
  isCurrency = false,
  colors,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-sm text-slate-400">No data available</div>;
  }

  // Sort by value descending for ranking
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...sorted.map(d => d.value), 1);
  const totalValue = sorted.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-3 w-full">
      {sorted.map((item, idx) => {
        const pct = Math.max(0, Math.min(100, (item.value / maxValue) * 100));
        const sharePct = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
        const color = colors[idx % colors.length];
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={item.label}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isHovered ? 'bg-slate-100/80' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
              <span className="font-medium text-slate-800 truncate max-w-[200px] flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {sharePct.toFixed(1)}% share
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatMetricNumber(item.value, isCurrency)}
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  opacity: isHovered ? 1 : 0.85,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
