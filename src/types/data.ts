export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  sampleValues: (string | number | boolean)[];
  min?: number;
  max?: number;
  uniqueCount: number;
}

export type DataRow = Record<string, string | number | boolean | null | undefined>;

export interface Dataset {
  id: string;
  name: string;
  description: string;
  rows: DataRow[];
  columns: ColumnMeta[];
  sourceType: 'preset' | 'upload' | 'pasted';
  uploadedAt: string;
}

export type ChartType =
  | 'bar'
  | 'horizontal-bar'
  | 'line'
  | 'area'
  | 'donut'
  | 'scatter'
  | 'radar'
  | 'heatmap'
  | 'funnel';

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
  groupBy?: string;
  sortBy?: 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc';
  limit?: number;
  colorTheme?: string;
  showGrid?: boolean;
}

export interface AggregatedDataPoint {
  label: string;
  value: number;
  count: number;
  rawItems?: DataRow[];
  groupBreakdown?: Record<string, number>;
}
