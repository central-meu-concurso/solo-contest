import { formatStudyTime } from '@/lib/studyUtils';

// Tempo legível; zero vira "–" para não poluir tabelas.
export const fmt = (minutes) => (minutes > 0 ? formatStudyTime(minutes) : '–');
export const fmtFull = (minutes) => formatStudyTime(minutes || 0);

export const chartTooltip = {
  backgroundColor: 'rgba(20, 24, 40, 0.9)',
  border: '1px solid rgba(99, 140, 255, 0.2)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

export const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';
