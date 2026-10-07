export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'indigo-slate',
    name: 'Executive Indigo',
    colors: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'],
  },
  {
    id: 'emerald-mint',
    name: 'Emerald Precision',
    colors: ['#059669', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#84cc16', '#14b8a6', '#0f766e'],
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Coral',
    colors: ['#ea580c', '#f59e0b', '#e11d48', '#8b5cf6', '#0284c7', '#10b981', '#d97706', '#9333ea'],
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    colors: ['#7c3aed', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f43f5e', '#eab308', '#64748b'],
  },
  {
    id: 'monochrome',
    name: 'Monochrome Steel',
    colors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#0284c7', '#475569'],
  },
];

export function getPalette(id?: string): string[] {
  const found = COLOR_PALETTES.find(p => p.id === id);
  return (found || COLOR_PALETTES[0]).colors;
}
