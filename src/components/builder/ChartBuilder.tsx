import React, { useState, useMemo } from 'react';
import { Dataset, ChartType, AggregationType } from '../../types/data';
import { aggregateDataset } from '../../utils/parser';
import { COLOR_PALETTES, getPalette } from '../../utils/theme';
import { BarChart } from '../charts/BarChart';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { LineChart } from '../charts/LineChart';
import { DonutChart } from '../charts/DonutChart';
import { ScatterChart } from '../charts/ScatterChart';
import { RadarChart } from '../charts/RadarChart';
import { HeatmapChart } from '../charts/HeatmapChart';
import { FunnelChart } from '../charts/FunnelChart';
import {
  BarChart2,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  Sliders,
  AlignLeft,
  Grid3X3,
  Filter,
} from 'lucide-react';

interface ChartBuilderProps {
  dataset: Dataset;
}

export const ChartBuilder: React.FC<ChartBuilderProps> = ({ dataset }) => {
  const { columns, rows } = dataset;

  // Identify column roles
  const numericColumns = useMemo(() => columns.filter(c => c.type === 'number'), [columns]);
  const categoricalColumns = useMemo(
    () => columns.filter(c => c.type === 'string' || c.type === 'date'),
    [columns]
  );

  // Configuration state
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisCol, setXAxisCol] = useState<string>(
    categoricalColumns[0]?.name || columns[0]?.name || ''
  );
  const [yAxisCol, setYAxisCol] = useState<string>(
    numericColumns[0]?.name || columns[1]?.name || ''
  );
  const [secondaryCol, setSecondaryCol] = useState<string>('none');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [sortBy, setSortBy] = useState<'value-desc' | 'value-asc' | 'label-asc' | 'label-desc'>('value-desc');
  const [limit, setLimit] = useState<number>(10);
  const [colorTheme, setColorTheme] = useState<string>('indigo-slate');
  const [isStacked, setIsStacked] = useState<boolean>(false);

  const colors = getPalette(colorTheme);

  // Aggregated data calculation
  const chartData = useMemo(() => {
    if (!xAxisCol || !yAxisCol) return [];
    const grp = secondaryCol !== 'none' ? secondaryCol : undefined;
    const pts = aggregateDataset(rows, xAxisCol, yAxisCol, aggregation, grp);

    // Apply sorting
    const sorted = [...pts].sort((a, b) => {
      if (sortBy === 'value-desc') return b.value - a.value;
      if (sortBy === 'value-asc') return a.value - b.value;
      if (sortBy === 'label-asc') return a.label.localeCompare(b.label);
      if (sortBy === 'label-desc') return b.label.localeCompare(a.label);
      return 0;
    });

    return limit > 0 ? sorted.slice(0, limit) : sorted;
  }, [rows, xAxisCol, yAxisCol, aggregation, secondaryCol, sortBy, limit]);

  // Is metric currency-like
  const isCurrency = useMemo(() => {
    const name = yAxisCol.toLowerCase();
    return (
      name.includes('revenue') ||
      name.includes('profit') ||
      name.includes('price') ||
      name.includes('spend') ||
      name.includes('cost') ||
      name.includes('mrr') ||
      name.includes('cac') ||
      name.includes('ltv')
    );
  }, [yAxisCol]);

  // Chart type presets definition
  const chartOptions: { id: ChartType; label: string; icon: React.ReactNode }[] = [
    { id: 'bar', label: 'Vertical Bar', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'horizontal-bar', label: 'Ranked Bar', icon: <AlignLeft className="w-4 h-4" /> },
    { id: 'line', label: 'Trend Line', icon: <LineIcon className="w-4 h-4" /> },
    { id: 'area', label: 'Area Fill', icon: <Layers className="w-4 h-4" /> },
    { id: 'donut', label: 'Donut Share', icon: <PieIcon className="w-4 h-4" /> },
    { id: 'scatter', label: 'Scatter & Bubble', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'radar', label: 'Radar Polygon', icon: <Sliders className="w-4 h-4" /> },
    { id: 'heatmap', label: 'Heatmap Matrix', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'funnel', label: 'Funnel Waterfall', icon: <Filter className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Control Panel */}
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
            Visualization Controls
          </h3>
          <p className="text-xs text-slate-500">
            Configure dimensions, metrics, aggregations, and layout
          </p>
        </div>

        {/* Chart type selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Chart Type
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {chartOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setChartType(opt.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  chartType === opt.id
                    ? 'bg-indigo-50 border border-indigo-300 text-indigo-700 font-semibold'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="mb-1">{opt.icon}</div>
                <span className="text-[11px] truncate w-full text-center">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dimension & Metric selectors */}
        <div className="space-y-3.5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Primary Dimension (X-Axis / Category)
            </label>
            <select
              value={xAxisCol}
              onChange={e => setXAxisCol(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Metric (Y-Axis / Values)
            </label>
            <select
              value={yAxisCol}
              onChange={e => setYAxisCol(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {numericColumns.length > 0 ? (
                numericColumns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} (Numeric)
                  </option>
                ))
              ) : (
                columns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Aggregation
              </label>
              <select
                value={aggregation}
                onChange={e => setAggregation(e.target.value as AggregationType)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="count">Count (Frequency)</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Group By (Breakdown)
              </label>
              <select
                value={secondaryCol}
                onChange={e => setSecondaryCol(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="none">None (Single Series)</option>
                {categoricalColumns
                  .filter(c => c.name !== xAxisCol)
                  .map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sort Order
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="value-desc">Highest Value First</option>
                <option value="value-asc">Lowest Value First</option>
                <option value="label-asc">A to Z</option>
                <option value="label-desc">Z to A</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Data Limit
              </label>
              <select
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={25}>Top 25</option>
                <option value={0}>All Records</option>
              </select>
            </div>
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Color Theme
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setColorTheme(p.id)}
                  title={p.name}
                  className={`flex items-center gap-1 p-1 rounded-md border transition-all cursor-pointer ${
                    colorTheme === p.id
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex -space-x-1">
                    {p.colors.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-white"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium px-1 truncate max-w-[80px]">
                    {p.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional toggles */}
          {chartType === 'bar' && secondaryCol !== 'none' && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-700 font-medium">Stack Bars</span>
              <button
                type="button"
                onClick={() => setIsStacked(!isStacked)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                  isStacked ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    isStacked ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Canvas / Chart Viewport */}
      <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[500px]">
        {/* Canvas Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {chartOptions.find(o => o.id === chartType)?.label}: {yAxisCol} by {xAxisCol}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span>{aggregation.toUpperCase()} aggregation</span>
              <span aria-hidden="true">·</span>
              <span>{chartData.length} data points</span>
              {secondaryCol !== 'none' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Grouped by {secondaryCol}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Chart Render */}
        <div className="flex-1 flex items-center justify-center w-full py-4">
          {chartType === 'bar' && (
            <BarChart
              data={chartData}
              metricName={yAxisCol}
              isCurrency={isCurrency}
              colors={colors}
              stacked={isStacked}
              height={360}
            />
          )}

          {chartType === 'horizontal-bar' && (
            <HorizontalBarChart
              data={chartData}
              metricName={yAxisCol}
              isCurrency={isCurrency}
              colors={colors}
            />
          )}

          {chartType === 'line' && (
            <LineChart
              data={chartData}
              metricName={yAxisCol}
              isCurrency={isCurrency}
              colors={colors}
              height={360}
            />
          )}

          {chartType === 'area' && (
            <LineChart
              data={chartData}
              metricName={yAxisCol}
              isCurrency={isCurrency}
              colors={colors}
              area={true}
              height={360}
            />
          )}

          {chartType === 'donut' && (
            <DonutChart
              data={chartData}
              metricName={yAxisCol}
              isCurrency={isCurrency}
              colors={colors}
              size={320}
            />
          )}

          {chartType === 'scatter' && (
            <ScatterChart
              rows={rows}
              xCol={xAxisCol}
              yCol={yAxisCol}
              labelCol={categoricalColumns[0]?.name}
              colors={colors}
              height={360}
            />
          )}

          {chartType === 'radar' && (
            <RadarChart
              data={chartData}
              metricName={yAxisCol}
              isCurrency={isCurrency}
              colors={colors}
              size={340}
            />
          )}

          {chartType === 'heatmap' && (
            <HeatmapChart
              rows={rows}
              xCol={xAxisCol}
              yCol={secondaryCol !== 'none' ? secondaryCol : categoricalColumns[1]?.name || columns[0].name}
              valCol={yAxisCol}
              isCurrency={isCurrency}
            />
          )}

          {chartType === 'funnel' && (
            <FunnelChart
              data={chartData}
              metricName={yAxisCol}
              isCurrency={isCurrency}
              colors={colors}
            />
          )}
        </div>

        {/* Canvas Footer Insight summary */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
          <span>
            Max: {chartData.length > 0 ? Math.max(...chartData.map(d => d.value)).toLocaleString() : 0}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Total:{' '}
            {chartData.length > 0
              ? chartData.reduce((acc, d) => acc + d.value, 0).toLocaleString()
              : 0}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Avg:{' '}
            {chartData.length > 0
              ? Math.round(
                  (chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length) * 10
                ) / 10
              : 0}
          </span>
        </div>
      </div>
    </div>
  );
};
