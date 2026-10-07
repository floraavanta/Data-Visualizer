import React from 'react';
import { AggregatedDataPoint } from '../../types/data';
import { formatMetricNumber } from '../../utils/parser';

interface FunnelChartProps {
  data: AggregatedDataPoint[];
  metricName: string;
  isCurrency?: boolean;
  colors: string[];
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  metricName,
  isCurrency = false,
  colors,
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-sm text-slate-400">No data available</div>;
  }

  // Sort descending to form a classic funnel shape
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const firstVal = sorted[0].value || 1;

  return (
    <div className="space-y-3 w-full py-2">
      {sorted.map((stage, idx) => {
        const pctOfTop = (stage.value / firstVal) * 100;
        const prevVal = idx > 0 ? sorted[idx - 1].value : null;
        const stepDropPct = prevVal && prevVal > 0 ? ((stage.value / prevVal) * 100).toFixed(1) : null;
        const color = colors[idx % colors.length];

        return (
          <div key={stage.label} className="group relative">
            <div className="flex items-center justify-between text-xs mb-1 px-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{stage.label}</span>
              </span>
              <div className="flex items-center gap-3">
                {stepDropPct && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stepDropPct}% of prev
                  </span>
                )}
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {formatMetricNumber(stage.value, isCurrency)}
                </span>
              </div>
            </div>

            {/* Funnel Centered Bar */}
            <div className="h-8 bg-slate-50 rounded-lg flex items-center justify-center p-1 relative border border-slate-100">
              <div
                className="h-full rounded-md transition-all duration-300 ease-out flex items-center justify-center relative overflow-hidden"
                style={{
                  width: `${Math.max(12, pctOfTop)}%`,
                  backgroundColor: color,
                  opacity: 0.88,
                }}
              >
                <span className="text-[10px] text-white font-mono font-medium drop-shadow-xs">
                  {pctOfTop.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
