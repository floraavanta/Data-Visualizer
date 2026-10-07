import React from 'react';

interface TooltipProps {
  x: number;
  y: number;
  title: string;
  items: { label: string; value: string | number; color?: string }[];
  visible: boolean;
}

export const ChartTooltip: React.FC<TooltipProps> = ({ x, y, title, items, visible }) => {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full transition-all duration-75"
      style={{
        left: `${x}px`,
        top: `${y - 10}px`,
      }}
    >
      <div className="bg-slate-900/95 text-white backdrop-blur-sm px-3 py-2 rounded-lg shadow-xl border border-slate-800 text-xs min-w-[140px] max-w-[260px]">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 truncate">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-400 truncate">
                {item.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-mono tabular-nums font-medium text-slate-100 shrink-0">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
