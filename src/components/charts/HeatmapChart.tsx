import React, { useState } from 'react';
import { DataRow } from '../../types/data';
import { formatMetricNumber } from '../../utils/parser';

interface HeatmapChartProps {
  rows: DataRow[];
  xCol: string;
  yCol: string;
  valCol: string;
  isCurrency?: boolean;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  rows,
  xCol,
  yCol,
  valCol,
  isCurrency = false,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: string; y: string; val: number } | null>(null);

  if (!rows || rows.length === 0) {
    return <div className="text-center py-12 text-sm text-slate-400">No data available</div>;
  }

  // Get unique X and Y categories
  const xCategories = Array.from(new Set(rows.map(r => String(r[xCol] || '(None)')))).slice(0, 8);
  const yCategories = Array.from(new Set(rows.map(r => String(r[yCol] || '(None)')))).slice(0, 8);

  // Compute cell matrix
  const matrix: Record<string, Record<string, { sum: number; count: number }>> = {};
  for (const y of yCategories) {
    matrix[y] = {};
    for (const x of xCategories) {
      matrix[y][x] = { sum: 0, count: 0 };
    }
  }

  for (const row of rows) {
    const x = String(row[xCol] || '(None)');
    const y = String(row[yCol] || '(None)');
    if (matrix[y] && matrix[y][x]) {
      const rawVal = row[valCol];
      const num = typeof rawVal === 'number' ? rawVal : Number(String(rawVal).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        matrix[y][x].sum += num;
        matrix[y][x].count += 1;
      }
    }
  }

  // Find max value for color scale
  let maxCellVal = 0;
  for (const y of yCategories) {
    for (const x of xCategories) {
      const v = matrix[y][x].sum;
      if (v > maxCellVal) maxCellVal = v;
    }
  }
  if (maxCellVal === 0) maxCellVal = 1;

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="min-w-[500px]">
        {/* Table grid */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-semibold text-slate-400 border-b border-slate-200">
                {yCol} \ {xCol}
              </th>
              {xCategories.map(x => (
                <th
                  key={x}
                  className="p-2 text-center text-xs font-semibold text-slate-600 border-b border-slate-200 max-w-[120px] truncate"
                  title={x}
                >
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yCategories.map(y => (
              <tr key={y} className="border-b border-slate-100">
                <td className="p-2 text-xs font-medium text-slate-700 whitespace-nowrap">
                  {y}
                </td>
                {xCategories.map(x => {
                  const val = matrix[y][x].sum;
                  const intensity = Math.min(1, val / maxCellVal);
                  const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

                  return (
                    <td
                      key={x}
                      onMouseEnter={() => setHoveredCell({ x, y, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className="p-1 text-center"
                    >
                      <div
                        className={`h-10 rounded flex items-center justify-center transition-all cursor-pointer ${
                          isHovered ? 'ring-2 ring-indigo-500 scale-95 shadow-sm' : ''
                        }`}
                        style={{
                          backgroundColor:
                            intensity === 0
                              ? '#f1f5f9'
                              : `rgba(79, 70, 229, ${0.12 + intensity * 0.88})`,
                          color: intensity > 0.5 ? '#ffffff' : '#334155',
                        }}
                      >
                        <span className="font-mono tabular-nums text-xs font-medium">
                          {val > 0 ? formatMetricNumber(val, isCurrency) : '—'}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend bar */}
        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Low Intensity</span>
            <div className="flex h-2.5 w-24 rounded-full overflow-hidden bg-gradient-to-r from-indigo-100 to-indigo-600" />
            <span>High Intensity</span>
          </div>
          {hoveredCell && (
            <div className="font-medium text-slate-700">
              {hoveredCell.y} × {hoveredCell.x}:{' '}
              <span className="font-mono tabular-nums font-semibold text-indigo-600">
                {formatMetricNumber(hoveredCell.val, isCurrency)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
