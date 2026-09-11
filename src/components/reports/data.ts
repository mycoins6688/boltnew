/**
 * Reports page — dummy content (templates, scheduled reports, exports).
 * All data is fictional; consumed by /reports only.
 */

export type PreviewKind = 'kpis' | 'area' | 'bars' | 'funnel' | 'heatmap' | 'gauge';

export type BlockType = 'kpi' | 'revenue' | 'funnel' | 'toppages' | 'cohort' | 'notes';

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: PreviewKind;
  blocks: BlockType[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'exec',
    name: 'Executive summary',
    description: 'One-pager for the board — MRR, growth, churn.',
    preview: 'kpis',
    blocks: ['kpi', 'revenue', 'notes'],
  },
  {
    id: 'growth',
    name: 'Growth weekly',
    description: 'Signups, activation, and week-over-week deltas.',
    preview: 'area',
    blocks: ['revenue', 'kpi', 'notes'],
  },
  {
    id: 'revenue',
    name: 'Revenue deep-dive',
    description: 'MRR movements: new, expansion, contraction, churn.',
    preview: 'bars',
    blocks: ['revenue', 'kpi', 'toppages'],
  },
  {
    id: 'funnel',
    name: 'Funnel snapshot',
    description: 'Stage-by-stage conversion with drop-offs.',
    preview: 'funnel',
    blocks: ['funnel', 'kpi', 'notes'],
  },
  {
    id: 'cohort',
    name: 'Cohort health',
    description: 'Retention by signup month, 6-month window.',
    preview: 'heatmap',
    blocks: ['cohort', 'notes'],
  },
  {
    id: 'usage',
    name: 'Usage & limits',
    description: 'API consumption vs plan quotas.',
    preview: 'gauge',
    blocks: ['kpi', 'toppages', 'notes'],
  },
];

export type Cadence = 'Daily' | 'Weekly Mon' | 'Monthly 1st';

export interface ScheduledReport {
  id: string;
  name: string;
  cadence: Cadence;
  recipients: string[];
  lastSent: string;
  active: boolean;
}

export const INITIAL_SCHEDULED: ScheduledReport[] = [
  { id: 'r1', name: 'Board metrics pack', cadence: 'Weekly Mon', recipients: ['Ava Reyes', 'Maya Chen', 'Owen Fischer', 'Priya Haddad', 'Liam Novak'], lastSent: 'Mar 10 · 09:00', active: true },
  { id: 'r2', name: 'Growth standup digest', cadence: 'Daily', recipients: ['Ava Reyes', 'Sofia Garcia', 'Kai Kimura'], lastSent: 'Mar 14 · 08:00', active: true },
  { id: 'r3', name: 'Churn watchlist', cadence: 'Daily', recipients: ['Ava Reyes', 'Ines Moreau'], lastSent: 'Mar 6 · 08:00', active: false },
  { id: 'r4', name: 'Investor update', cadence: 'Monthly 1st', recipients: ['Ava Reyes', 'Noah Petrov', 'Lena Nguyen', 'Felix Costa'], lastSent: 'Mar 1 · 09:00', active: true },
  { id: 'r5', name: 'API usage audit', cadence: 'Weekly Mon', recipients: ['Ava Reyes', 'Dante Reyes'], lastSent: 'Mar 3 · 09:00', active: false },
  { id: 'r6', name: 'Cohort health check', cadence: 'Monthly 1st', recipients: ['Ava Reyes', 'Nora Kowalski', 'Yuki Dubois'], lastSent: 'Mar 1 · 09:30', active: true },
];

export interface ExportFile {
  id: string;
  name: string;
  kind: 'pdf' | 'csv';
  size: string;
  time: string;
}

export const EXPORTS: ExportFile[] = [
  { id: 'e1', name: 'vantage_mrr_march.pdf', kind: 'pdf', size: '1.8 MB', time: 'Mar 14 · 11:42' },
  { id: 'e2', name: 'board_pack_q1.pdf', kind: 'pdf', size: '2.4 MB', time: 'Mar 13 · 16:05' },
  { id: 'e3', name: 'raw_events_mar12.csv', kind: 'csv', size: '18.1 MB', time: 'Mar 12 · 09:31' },
  { id: 'e4', name: 'churn_watchlist_mar11.pdf', kind: 'pdf', size: '0.9 MB', time: 'Mar 11 · 14:20' },
  { id: 'e5', name: 'cohort_export_feb.csv', kind: 'csv', size: '6.7 MB', time: 'Mar 10 · 10:12' },
  { id: 'e6', name: 'investor_update_mar.pdf', kind: 'pdf', size: '3.2 MB', time: 'Mar 9 · 17:48' },
];

export const BLOCK_META: Record<BlockType, { label: string; hint: string }> = {
  kpi: { label: 'KPI summary row', hint: 'MRR, growth, churn, NRR' },
  revenue: { label: 'Revenue chart', hint: 'Streaming area chart, 60 points' },
  funnel: { label: 'Funnel', hint: 'Stage conversion with drop-offs' },
  toppages: { label: 'Top pages table', hint: 'Top 5 pages by views' },
  cohort: { label: 'Cohort strip', hint: '6-month retention heatmap' },
  notes: { label: 'Notes', hint: 'Rich text commentary block' },
};

export const ALL_BLOCKS: BlockType[] = ['kpi', 'revenue', 'funnel', 'toppages', 'cohort', 'notes'];
