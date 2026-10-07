import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMetricNumber } from '../../utils/parser';

interface MetricKPICardProps {
  label: string;
  value: number;
  subtext?: string;
  trend?: number; // e.g. +14.2%
  isCurrency?: boolean;
  isPercent?: boolean;
  minVal?: number;
  maxVal?: number;
  avgVal?: number;
}

export const MetricKPICard: React.FC<MetricKPICardProps> = ({
  label,
  value,
  subtext,
  trend,
  isCurrency = false,
  isPercent = false,
  minVal,
  maxVal,
  avgVal,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium tracking-tight text-slate-600 truncate">{label}</span>
          {trend !== undefined && (
            <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
              {trend > 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{trend.toFixed(1)}%
                </span>
              ) : trend < 0 ? (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {trend.toFixed(1)}%
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-0.5">
                  <Minus className="w-3.5 h-3.5" />
                  0.0%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Primary figure */}
        <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 tracking-tight my-1">
          {formatMetricNumber(value, isCurrency, isPercent)}
        </div>
      </div>

      {/* Unboxed metadata separator discipline */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 font-mono tabular-nums">
        {subtext && <span>{subtext}</span>}
        {avgVal !== undefined && (
          <>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Avg {formatMetricNumber(avgVal, isCurrency, isPercent)}</span>
          </>
        )}
        {maxVal !== undefined && (
          <>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Peak {formatMetricNumber(maxVal, isCurrency, isPercent)}</span>
          </>
        )}
      </div>
    </div>
  );
};
