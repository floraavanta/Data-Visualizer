import React, { useState, useMemo } from 'react';
import { ColumnMeta, DataRow } from '../../types/data';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Edit2, Check, X } from 'lucide-react';
import { exportToCSV, formatMetricNumber } from '../../utils/parser';

interface DataTableProps {
  columns: ColumnMeta[];
  rows: DataRow[];
  onUpdateRow?: (rowIndex: number, field: string, value: any) => void;
  datasetName: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  onUpdateRow,
  datasetName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(15);
  const [page, setPage] = useState<number>(1);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; field: string; value: string } | null>(null);

  // Filter rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row =>
      Object.values(row).some(val =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [rows, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal);
      const strB = String(bVal);
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRows, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colName);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(columns, sortedRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${datasetName.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveEdit = () => {
    if (!editingCell || !onUpdateRow) return;
    const { rowIdx, field, value } = editingCell;
    const colMeta = columns.find(c => c.name === field);
    let parsedVal: any = value;
    if (colMeta?.type === 'number') {
      const n = Number(value.replace(/[^0-9.-]/g, ''));
      parsedVal = isNaN(n) ? 0 : n;
    }
    onUpdateRow(rowIdx, field, parsedVal);
    setEditingCell(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Table toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search across all fields..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {filteredRows.length} rows · {columns.length} columns
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium select-none">
              <th className="py-2.5 px-3 w-10 text-slate-400 text-center font-mono text-[10px]">#</th>
              {columns.map(col => {
                const isSorted = sortCol === col.name;
                const isNumeric = col.type === 'number';

                return (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className={`py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap ${
                      isNumeric ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        isNumeric ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="font-semibold text-slate-700">{col.name}</span>
                      <span className="text-slate-400">
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                  No records match your search query
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => {
                const globalRowIdx = (page - 1) * pageSize + rowIdx;

                return (
                  <tr
                    key={globalRowIdx}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px] tabular-nums">
                      {globalRowIdx + 1}
                    </td>

                    {columns.map(col => {
                      const val = row[col.name];
                      const isNumeric = col.type === 'number';
                      const isEditing =
                        editingCell?.rowIdx === globalRowIdx && editingCell?.field === col.name;

                      return (
                        <td
                          key={col.name}
                          className={`py-2 px-3 whitespace-nowrap ${
                            isNumeric
                              ? 'text-right font-mono tabular-nums text-slate-900 font-medium'
                              : 'text-left text-slate-700'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                type="text"
                                value={editingCell.value}
                                onChange={e =>
                                  setEditingCell({ ...editingCell, value: e.target.value })
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full px-1.5 py-0.5 text-xs bg-white border border-indigo-500 rounded text-slate-900 focus:outline-none"
                              />
                              <button
                                onClick={saveEdit}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="text-rose-500 hover:text-rose-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                if (onUpdateRow) {
                                  setEditingCell({
                                    rowIdx: globalRowIdx,
                                    field: col.name,
                                    value: val !== null && val !== undefined ? String(val) : '',
                                  });
                                }
                              }}
                              className="cursor-pointer group/cell flex items-center gap-1.5 inline-flex"
                              title="Click to edit value"
                            >
                              <span>
                                {isNumeric && typeof val === 'number'
                                  ? formatMetricNumber(val)
                                  : val !== null && val !== undefined
                                  ? String(val)
                                  : '—'}
                              </span>
                              {onUpdateRow && (
                                <Edit2 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
