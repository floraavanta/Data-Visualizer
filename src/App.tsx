import React, { useState } from 'react';
import { Dataset } from './types/data';
import { defaultDatasets, enterpriseSalesDataset } from './data/sampleDatasets';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ChartBuilder } from './components/builder/ChartBuilder';
import { DataTable } from './components/analytics/DataTable';
import { DataImportModal } from './components/importer/DataImportModal';
import {
  Upload,
  Database,
  Layers,
  LayoutDashboard,
  Table as TableIcon,
  Sparkles,
  Download,
} from 'lucide-react';
import { exportToCSV } from './utils/parser';

export default function App() {
  const [activeDataset, setActiveDataset] = useState<Dataset>(enterpriseSalesDataset);
  const [activeTab, setActiveTab] = useState<'overview' | 'builder' | 'table'>('overview');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Allow inline editing of table cells
  const handleUpdateRow = (rowIndex: number, field: string, value: any) => {
    setActiveDataset(prev => {
      const updatedRows = [...prev.rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [field]: value,
      };
      return {
        ...prev,
        rows: updatedRows,
      };
    });
  };

  const handleDatasetLoaded = (newDataset: Dataset) => {
    setActiveDataset(newDataset);
    setActiveTab('overview');
  };

  const handleExportFullCSV = () => {
    const csv = exportToCSV(activeDataset.columns, activeDataset.rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Universal 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              Ω
            </div>
            <a
              href="/"
              onClick={e => {
                e.preventDefault();
                setActiveTab('overview');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors"
            >
              OmniMetrics
            </a>
          </div>

          {/* Zone 2: Clean text navigation links / view switcher */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visualizer</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Grid</span>
            </button>
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFullCSV}
              title="Download current data as CSV"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dataset Context Bar & Quick Switcher */}
      <section className="bg-slate-100/70 border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Active dataset metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">{activeDataset.name}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono tabular-nums text-slate-500">
              {activeDataset.rows.length} rows · {activeDataset.columns.length} columns
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-400 capitalize">{activeDataset.sourceType} data</span>
          </div>

          {/* Quick preset switch */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">Quick Switch:</span>
            <select
              value={activeDataset.id}
              onChange={e => {
                const target = defaultDatasets.find(d => d.id === e.target.value);
                if (target) setActiveDataset(target);
              }}
              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {defaultDatasets.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
              {activeDataset.sourceType !== 'preset' && (
                <option value={activeDataset.id}>{activeDataset.name} (Custom)</option>
              )}
            </select>
          </div>
        </div>
      </section>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 min-w-0 overflow-x-hidden">
        {/* Prominent Data Callout Banner if user hasn't imported custom data yet */}
        {activeDataset.sourceType === 'preset' && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Ready to visualize your own data?
                </h4>
                <p className="text-[11px] text-slate-500">
                  You can paste CSV/Excel tables directly or upload your file to update all charts instantly with your exact data.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              Paste / Upload Data Now
            </button>
          </div>
        )}

        {/* Views */}
        {activeTab === 'overview' && (
          <DashboardOverview
            dataset={activeDataset}
            onNavigateToBuilder={() => setActiveTab('builder')}
            onNavigateToTable={() => setActiveTab('table')}
          />
        )}

        {activeTab === 'builder' && <ChartBuilder dataset={activeDataset} />}

        {activeTab === 'table' && (
          <DataTable
            columns={activeDataset.columns}
            rows={activeDataset.rows}
            onUpdateRow={handleUpdateRow}
            datasetName={activeDataset.name}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">OmniMetrics</span>
            <span aria-hidden="true">·</span>
            <span>Interactive Data Visualization Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Import Data
            </button>
            <button
              onClick={handleExportFullCSV}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Export Current View
            </button>
          </div>
        </div>
      </footer>

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
        currentDataset={activeDataset}
      />
    </div>
  );
}
