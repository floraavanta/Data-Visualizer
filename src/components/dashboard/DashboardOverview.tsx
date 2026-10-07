import React, { useState, useMemo } from 'react';
import { Dataset } from '../../types/data';
import { aggregateDataset } from '../../utils/parser';
import { getPalette } from '../../utils/theme';
import { MetricKPICard } from '../analytics/MetricKPICard';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { DonutChart } from '../charts/DonutChart';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { RadarChart } from '../charts/RadarChart';
import { HeatmapChart } from '../charts/HeatmapChart';
import { BarChart2, LineChart as LineIcon, Filter, X } from 'lucide-react';

interface DashboardOverviewProps {
  dataset: Dataset;
  onNavigateToBuilder: () => void;
  onNavigateToTable: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dataset,
  onNavigateToBuilder,
}) => {
  const { columns, rows } = dataset;

  // Detect key columns
  const numericCols = useMemo(() => columns.filter(c => c.type === 'number'), [columns]);
  const catCols = useMemo(
    () => columns.filter(c => c.type === 'string' || c.type === 'date'),
    [columns]
  );

  const primaryMetric = numericCols[0]?.name || columns[1]?.name || 'Value';
  const secondaryMetric = numericCols[1]?.name || numericCols[0]?.name || 'Count';
  const primaryDim = catCols[0]?.name || columns[0]?.name || 'Category';
  const secondaryDim = catCols[1]?.name || catCols[0]?.name || 'SubCategory';

  // Client-side quick filter state
  const [filterDim, setFilterDim] = useState<string>('');
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('all');
  const [mainChartType, setMainChartType] = useState<'bar' | 'line'>('bar');

  // Active filter dimension (fallback to secondaryDim or primaryDim)
  const activeFilterDim = useMemo(() => {
    if (filterDim && catCols.some(c => c.name === filterDim)) {
      return filterDim;
    }
    return secondaryDim || primaryDim || catCols[0]?.name || '';
  }, [filterDim, catCols, secondaryDim, primaryDim]);

  // Unique values and record counts for active filter dimension
  const filterOptions = useMemo(() => {
    if (!activeFilterDim) return [];
    const countMap = new Map<string, number>();
    rows.forEach(r => {
      const v = r[activeFilterDim];
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        const str = String(v);
        countMap.set(str, (countMap.get(str) || 0) + 1);
      }
    });
    return Array.from(countMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows, activeFilterDim]);

  const filteredRows = useMemo(() => {
    if (selectedFilterValue === 'all' || !activeFilterDim) return rows;
    return rows.filter(r => String(r[activeFilterDim]) === selectedFilterValue);
  }, [rows, activeFilterDim, selectedFilterValue]);

  // Executive KPI aggregations
  const totalPrimary = useMemo(() => {
    return filteredRows.reduce((sum, r) => {
      const v = r[primaryMetric];
      return sum + (typeof v === 'number' ? v : 0);
    }, 0);
  }, [filteredRows, primaryMetric]);

  const totalSecondary = useMemo(() => {
    return filteredRows.reduce((sum, r) => {
      const v = r[secondaryMetric];
      return sum + (typeof v === 'number' ? v : 0);
    }, 0);
  }, [filteredRows, secondaryMetric]);

  const avgPrimary = filteredRows.length > 0 ? totalPrimary / filteredRows.length : 0;
  const maxPrimary = Math.max(
    ...filteredRows.map(r => (typeof r[primaryMetric] === 'number' ? (r[primaryMetric] as number) : 0)),
    0
  );

  const isPrimaryCurrency = useMemo(() => {
    const n = primaryMetric.toLowerCase();
    return n.includes('revenue') || n.includes('profit') || n.includes('spend') || n.includes('cost') || n.includes('mrr');
  }, [primaryMetric]);

  const colors = getPalette('indigo-slate');
  const sunsetColors = getPalette('sunset-amber');

  // Aggregations for visual charts
  const mainAggData = useMemo(() => {
    return aggregateDataset(filteredRows, primaryDim, primaryMetric, 'sum', undefined, 10);
  }, [filteredRows, primaryDim, primaryMetric]);

  const shareAggData = useMemo(() => {
    const dim = secondaryDim !== primaryDim ? secondaryDim : primaryDim;
    return aggregateDataset(filteredRows, dim, primaryMetric, 'sum', undefined, 6);
  }, [filteredRows, secondaryDim, primaryDim, primaryMetric]);

  const rankedAggData = useMemo(() => {
    return aggregateDataset(filteredRows, primaryDim, secondaryMetric, 'sum', undefined, 8);
  }, [filteredRows, primaryDim, secondaryMetric]);

  return (
    <div className="space-y-6">
      {/* Top Filter and Dataset Context Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full max-w-full min-w-0 overflow-hidden">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter by:</span>
          </div>

          {/* Dimension dropdown selector */}
          {catCols.length > 1 && (
            <select
              value={activeFilterDim}
              onChange={e => {
                setFilterDim(e.target.value);
                setSelectedFilterValue('all');
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shrink-0"
              title="Select column to filter by"
            >
              {catCols.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* If 5 or fewer items: wrapped segmented buttons */}
          {filterOptions.length <= 5 ? (
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <button
                onClick={() => setSelectedFilterValue('all')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedFilterValue === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({rows.length})
              </button>
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedFilterValue(opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer truncate max-w-[150px] ${
                    selectedFilterValue === opt.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                  title={`${opt.value} (${opt.count} records)`}
                >
                  {opt.value} ({opt.count})
                </button>
              ))}
            </div>
          ) : (
            /* If more than 5 items (e.g. many products/categories): compact dropdown */
            <div className="flex items-center gap-2 min-w-0 max-w-xs sm:max-w-sm flex-1">
              <select
                value={selectedFilterValue}
                onChange={e => setSelectedFilterValue(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer truncate"
              >
                <option value="all">
                  All {activeFilterDim}s ({rows.length} total)
                </option>
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count} records)
                  </option>
                ))}
              </select>

              {selectedFilterValue !== 'all' && (
                <button
                  onClick={() => setSelectedFilterValue('all')}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="Clear filter"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={onNavigateToBuilder}
            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            Customize Visualizations →
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKPICard
          label={`Total ${primaryMetric}`}
          value={totalPrimary}
          trend={12.4}
          isCurrency={isPrimaryCurrency}
          avgVal={avgPrimary}
          maxVal={maxPrimary}
          subtext={`${filteredRows.length} active records`}
        />
        <MetricKPICard
          label={`Aggregate ${secondaryMetric}`}
          value={totalSecondary}
          trend={8.1}
          avgVal={filteredRows.length > 0 ? totalSecondary / filteredRows.length : 0}
          subtext="Volume pace"
        />
        <MetricKPICard
          label={`Average ${primaryMetric}`}
          value={avgPrimary}
          isCurrency={isPrimaryCurrency}
          subtext="Per-record mean"
        />
        <MetricKPICard
          label="Total Records"
          value={filteredRows.length}
          trend={filteredRows.length === rows.length ? 0 : -((rows.length - filteredRows.length) / rows.length) * 100}
          subtext={`of ${rows.length} total dataset entries`}
        />
      </div>

      {/* Primary Chart and Share Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main interactive bar/line chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {primaryMetric} by {primaryDim}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Aggregated sum across {mainAggData.length} categories
              </p>
            </div>

            {/* Chart type toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setMainChartType('bar')}
                title="Bar Chart"
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  mainChartType === 'bar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMainChartType('line')}
                title="Line Chart"
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  mainChartType === 'line'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LineIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="py-2">
            {mainChartType === 'bar' ? (
              <BarChart
                data={mainAggData}
                metricName={primaryMetric}
                isCurrency={isPrimaryCurrency}
                colors={colors}
                height={280}
              />
            ) : (
              <LineChart
                data={mainAggData}
                metricName={primaryMetric}
                isCurrency={isPrimaryCurrency}
                colors={colors}
                area={true}
                height={280}
              />
            )}
          </div>
        </div>

        {/* Donut Distribution */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Distribution Share
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Proportional breakdown of {primaryMetric}
            </p>
          </div>

          <div className="py-2 flex items-center justify-center">
            <DonutChart
              data={shareAggData}
              metricName={primaryMetric}
              isCurrency={isPrimaryCurrency}
              colors={sunsetColors}
              size={240}
            />
          </div>
        </div>
      </div>

      {/* Secondary Multi-Perspective Row: Ranked List + Matrix/Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Horizontal Bars */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Ranked Comparison: {secondaryMetric}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Top performers ranked by total volume
            </p>
          </div>

          <HorizontalBarChart
            data={rankedAggData}
            metricName={secondaryMetric}
            colors={colors}
          />
        </div>

        {/* 2D Heatmap or Radar */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {secondaryDim !== primaryDim ? `${primaryDim} × ${secondaryDim} Matrix` : 'Multi-Dimensional Radar'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Cross-dimensional density & intensity
            </p>
          </div>

          {secondaryDim !== primaryDim ? (
            <HeatmapChart
              rows={filteredRows}
              xCol={primaryDim}
              yCol={secondaryDim}
              valCol={primaryMetric}
              isCurrency={isPrimaryCurrency}
            />
          ) : (
            <RadarChart
              data={mainAggData}
              metricName={primaryMetric}
              isCurrency={isPrimaryCurrency}
              colors={colors}
              size={280}
            />
          )}
        </div>
      </div>
    </div>
  );
};
