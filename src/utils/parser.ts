import { ColumnMeta, ColumnType, DataRow, AggregationType, AggregatedDataPoint } from '../types/data';

/**
 * Autodetect delimiter: comma, tab, semicolon, pipe
 */
function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r?\n/).filter(line => line.trim().length > 0).slice(0, 5);
  if (firstLines.length === 0) return ',';

  const counts: Record<string, number> = { ',': 0, '\t': 0, ';': 0, '|': 0 };
  for (const line of firstLines) {
    counts[','] += (line.match(/,/g) || []).length;
    counts['\t'] += (line.match(/\t/g) || []).length;
    counts[';'] += (line.match(/;/g) || []).length;
    counts['|'] += (line.match(/\|/g) || []).length;
  }

  let best = ',';
  let max = -1;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      best = delim;
    }
  }
  return best;
}

/**
 * Parse delimiter-separated values (CSV/TSV/etc) with quotes handling
 */
export function parseDelimitedText(text: string, customDelimiter?: string): { headers: string[]; rows: DataRow[] } {
  const delimiter = customDelimiter || detectDelimiter(text);
  const lines: string[] = [];
  
  // Handle newlines inside quotes
  let currentField = '';
  let insideQuotes = false;
  let currentTokens: string[] = [];
  const parsedRows: string[][] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentTokens.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentTokens.push(currentField.trim());
      if (currentTokens.some(t => t.length > 0)) {
        parsedRows.push(currentTokens);
      }
      currentTokens = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentTokens.length > 0) {
    currentTokens.push(currentField.trim());
    if (currentTokens.some(t => t.length > 0)) {
      parsedRows.push(currentTokens);
    }
  }

  if (parsedRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = parsedRows[0].map((h, idx) => (h && h.trim().length > 0 ? h.trim() : `Column_${idx + 1}`));
  // Ensure unique headers
  const headers: string[] = [];
  const seen: Record<string, number> = {};
  for (const h of rawHeaders) {
    if (seen[h] !== undefined) {
      seen[h]++;
      headers.push(`${h}_${seen[h]}`);
    } else {
      seen[h] = 0;
      headers.push(h);
    }
  }

  const rows: DataRow[] = [];
  for (let r = 1; r < parsedRows.length; r++) {
    const tokens = parsedRows[r];
    const rowObj: DataRow = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      const val = tokens[c] !== undefined ? tokens[c] : '';
      rowObj[header] = parseValue(val);
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Parse JSON data array or object
 */
export function parseJSONData(text: string): { headers: string[]; rows: DataRow[] } {
  const parsed = JSON.parse(text);
  const array = Array.isArray(parsed) ? parsed : parsed.data || parsed.rows || [parsed];
  
  if (!Array.isArray(array) || array.length === 0) {
    throw new Error('JSON does not contain an array of objects.');
  }

  const headerSet = new Set<string>();
  for (const item of array) {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(k => headerSet.add(k));
    }
  }
  const headers = Array.from(headerSet);

  const rows: DataRow[] = array.map(item => {
    const rowObj: DataRow = {};
    for (const h of headers) {
      const val = item[h];
      rowObj[h] = typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
    }
    return rowObj;
  });

  return { headers, rows };
}

/**
 * Universal auto-detection parser for string inputs (CSV/TSV/JSON)
 */
export function parseAnyData(rawText: string): { headers: string[]; rows: DataRow[] } {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('[') || (trimmed.startsWith('{') && trimmed.includes('"data"'))) {
    try {
      return parseJSONData(trimmed);
    } catch {
      // Fallback to delimited parsing
    }
  }
  return parseDelimitedText(trimmed);
}

/**
 * Clean & normalize scalar values (numbers with currency/commas, dates, booleans)
 */
export function parseValue(val: string): string | number | boolean | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'na' || str.toLowerCase() === 'n/a') {
    return null;
  }

  if (str.toLowerCase() === 'true') return true;
  if (str.toLowerCase() === 'false') return false;

  // Check if numeric (stripping $, €, £, %, commas)
  const cleanNumStr = str.replace(/^[$\€\£\¥]/, '').replace(/%$/, '').replace(/,/g, '').trim();
  if (!isNaN(Number(cleanNumStr)) && cleanNumStr !== '') {
    return Number(cleanNumStr);
  }

  return str;
}

/**
 * Infer column metadata and types
 */
export function inferColumnMetadata(headers: string[], rows: DataRow[]): ColumnMeta[] {
  return headers.map(header => {
    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let stringCount = 0;
    let validCount = 0;

    let min = Infinity;
    let max = -Infinity;
    const uniqueVals = new Set<any>();
    const samples: any[] = [];

    for (const row of rows) {
      const val = row[header];
      if (val === null || val === undefined || val === '') continue;

      validCount++;
      if (samples.length < 5) samples.push(val);
      uniqueVals.add(val);

      if (typeof val === 'number') {
        numberCount++;
        if (val < min) min = val;
        if (val > max) max = val;
      } else if (typeof val === 'boolean') {
        booleanCount++;
      } else if (typeof val === 'string') {
        // Test date
        const isDatePattern = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(val) ||
                              /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(val) ||
                              /^[A-Za-z]{3,9}\s+\d{1,2}(,\s+\d{4})?/.test(val) ||
                              /^\d{4}-Q[1-4]$/i.test(val);
        const parsedTime = Date.parse(val);
        if (isDatePattern && !isNaN(parsedTime) && parsedTime > 0) {
          dateCount++;
        } else {
          stringCount++;
        }
      }
    }

    let type: ColumnType = 'string';
    if (validCount > 0) {
      if (numberCount / validCount >= 0.7) {
        type = 'number';
      } else if (dateCount / validCount >= 0.7) {
        type = 'date';
      } else if (booleanCount / validCount >= 0.7) {
        type = 'boolean';
      }
    }

    return {
      name: header,
      type,
      sampleValues: samples,
      min: min !== Infinity ? min : undefined,
      max: max !== -Infinity ? max : undefined,
      uniqueCount: uniqueVals.size,
    };
  });
}

/**
 * Aggregates dataset rows by X-Axis and Y-Axis metric
 */
export function aggregateDataset(
  rows: DataRow[],
  xAxisCol: string,
  yAxisCol: string,
  aggregation: AggregationType,
  groupByCol?: string,
  limit?: number
): AggregatedDataPoint[] {
  const map: Map<string, { sum: number; count: number; min: number; max: number; items: DataRow[]; groups: Record<string, number> }> = new Map();

  for (const row of rows) {
    const rawX = row[xAxisCol];
    const xKey = rawX === null || rawX === undefined ? '(Blank)' : String(rawX);
    
    let rawY = row[yAxisCol];
    let numY = 0;
    if (typeof rawY === 'number') {
      numY = rawY;
    } else if (typeof rawY === 'string') {
      const parsed = Number(rawY.replace(/^[$\€\£\¥]/, '').replace(/%$/, '').replace(/,/g, '').trim());
      numY = isNaN(parsed) ? 0 : parsed;
    } else if (rawY === true) {
      numY = 1;
    }

    if (!map.has(xKey)) {
      map.set(xKey, { sum: 0, count: 0, min: Infinity, max: -Infinity, items: [], groups: {} });
    }

    const entry = map.get(xKey)!;
    entry.sum += numY;
    entry.count += 1;
    if (numY < entry.min) entry.min = numY;
    if (numY > entry.max) entry.max = numY;
    entry.items.push(row);

    if (groupByCol && row[groupByCol]) {
      const gKey = String(row[groupByCol]);
      entry.groups[gKey] = (entry.groups[gKey] || 0) + (aggregation === 'count' ? 1 : numY);
    }
  }

  const points: AggregatedDataPoint[] = [];
  for (const [label, data] of map.entries()) {
    let finalValue = 0;
    switch (aggregation) {
      case 'sum':
        finalValue = data.sum;
        break;
      case 'avg':
        finalValue = data.count > 0 ? data.sum / data.count : 0;
        break;
      case 'count':
        finalValue = data.count;
        break;
      case 'min':
        finalValue = data.min !== Infinity ? data.min : 0;
        break;
      case 'max':
        finalValue = data.max !== -Infinity ? data.max : 0;
        break;
    }

    points.push({
      label,
      value: Math.round(finalValue * 100) / 100,
      count: data.count,
      rawItems: data.items,
      groupBreakdown: data.groups,
    });
  }

  if (limit && limit > 0) {
    return points.slice(0, limit);
  }

  return points;
}

/**
 * Format number with clean typography and abbreviation
 */
export function formatMetricNumber(val: number | null | undefined, isCurrency = false, isPercent = false): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  
  if (isPercent) {
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  const prefix = isCurrency ? '$' : '';
  const absVal = Math.abs(val);

  if (absVal >= 1_000_000_000) {
    return `${prefix}${(val / 1_000_000_000).toFixed(2)}B`;
  }
  if (absVal >= 1_000_000) {
    return `${prefix}${(val / 1_000_000).toFixed(2)}M`;
  }
  if (absVal >= 10_000) {
    return `${prefix}${(val / 1_000).toFixed(1)}k`;
  }
  if (Number.isInteger(val)) {
    return `${prefix}${val.toLocaleString()}`;
  }
  return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
}

/**
 * Generate CSV text from rows
 */
export function exportToCSV(columns: ColumnMeta[], rows: DataRow[]): string {
  const headers = columns.map(c => `"${c.name.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map(row => {
    return columns.map(c => {
      const val = row[c.name];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headers, ...rowLines].join('\n');
}
