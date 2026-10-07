import React, { useState } from 'react';
import { Dataset } from '../../types/data';
import { parseAnyData, inferColumnMetadata } from '../../utils/parser';
import { defaultDatasets } from '../../data/sampleDatasets';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Sparkles, Database } from 'lucide-react';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: Dataset) => void;
  currentDataset: Dataset;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
  currentDataset,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'presets'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [datasetName, setDatasetName] = useState('My Custom Dataset');
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{ rowCount: number; colCount: number; headers: string[] } | null>(null);

  if (!isOpen) return null;

  // Real-time parser validation
  const handleTextChange = (text: string) => {
    setPastedText(text);
    setParseError(null);

    if (!text.trim()) {
      setPreviewInfo(null);
      return;
    }

    try {
      const { headers, rows } = parseAnyData(text);
      if (headers.length === 0 || rows.length === 0) {
        setParseError('Could not detect headers or data rows. Make sure the first line has column titles.');
        setPreviewInfo(null);
      } else {
        setPreviewInfo({
          rowCount: rows.length,
          colCount: headers.length,
          headers,
        });
      }
    } catch (err: any) {
      setParseError(err.message || 'Error parsing data format');
      setPreviewInfo(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDatasetName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleApplyData = () => {
    try {
      const { headers, rows } = parseAnyData(pastedText);
      if (headers.length === 0 || rows.length === 0) {
        setParseError('Please provide at least one header row and one data row.');
        return;
      }

      const columns = inferColumnMetadata(headers, rows);
      const newDataset: Dataset = {
        id: `custom-${Date.now()}`,
        name: datasetName.trim() || 'Custom Dataset',
        description: `Imported with ${rows.length} records and ${columns.length} columns.`,
        rows,
        columns,
        sourceType: activeTab === 'upload' ? 'upload' : 'pasted',
        uploadedAt: new Date().toISOString().split('T')[0],
      };

      onDatasetLoaded(newDataset);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to load dataset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Import Your Dataset
              </h2>
              <p className="text-xs text-slate-500">
                Paste CSV/TSV from spreadsheets, upload files, or pick a curated template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 bg-slate-50/40">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Paste Data (CSV / TSV / JSON)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload File (.csv, .tsv, .json)
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Explore Sample Datasets
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={e => setDatasetName(e.target.value)}
                  placeholder="e.g. Q3 Sales & Performance"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Paste raw text or copy-paste directly from Google Sheets / Excel
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Comma, Tab, or Semicolon separated
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={pastedText}
                  onChange={e => handleTextChange(e.target.value)}
                  placeholder={`Date,Category,Region,Revenue,Units\n2026-01-15,Electronics,North,45000,120\n2026-01-16,Furniture,West,28000,85\n2026-01-17,Electronics,South,62000,190\n2026-01-18,Clothing,North,19500,240`}
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={e => setDatasetName(e.target.value)}
                  placeholder="Dataset Name"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700 mb-1">
                  Drag and drop your file here, or browse
                </p>
                <p className="text-[11px] text-slate-400 mb-4">
                  Supports CSV, TSV, and JSON formats
                </p>
                <label className="inline-block px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                  Select File
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {pastedText && (
                <div className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 truncate">
                  Loaded {pastedText.length.toLocaleString()} characters from file.
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Choose a pre-configured, rich dataset to explore chart modes immediately:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {defaultDatasets.map(dataset => {
                  const isCurrent = dataset.id === currentDataset.id;
                  return (
                    <div
                      key={dataset.id}
                      onClick={() => {
                        onDatasetLoaded(dataset);
                        onClose();
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm">{dataset.name}</span>
                        {isCurrent && (
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{dataset.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono tabular-nums">
                        <span>{dataset.rows.length} rows</span>
                        <span aria-hidden="true">·</span>
                        <span>{dataset.columns.length} columns: {dataset.columns.slice(0, 4).map(c => c.name).join(', ')}...</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Validation Status & Column Preview */}
          {previewInfo && activeTab !== 'presets' && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Valid dataset detected!</span>
                <span className="text-emerald-700 font-mono tabular-nums font-normal">
                  ({previewInfo.rowCount} rows · {previewInfo.colCount} columns)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {previewInfo.headers.map(h => (
                  <span
                    key={h}
                    className="text-[11px] font-mono text-slate-700 bg-white/90 border border-emerald-200 px-2 py-0.5 rounded"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parseError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>

          {activeTab !== 'presets' && (
            <button
              disabled={!previewInfo}
              onClick={handleApplyData}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Dataset & Visualize</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
