/**
 * Analytics page — dummy datasets (analytics.md).
 * Deterministic seeds so every surface looks good on first paint; filters
 * (breakdown / segment / range) re-slice these generators.
 */
import { mulberry32, seededSeries, fmtCompact } from '@/lib/live';

/* -------------------------------- metrics -------------------------------- */

export type MetricId = 'signups' | 'users' | 'revenue' | 'conversion';
export type Unit = 'count' | 'currency' | 'percent';

export interface MetricDef {
  id: MetricId;
  label: string;
  color: string;
  unit: Unit;
  seed: number;
  base: number;
}

export const METRICS: readonly MetricDef[] = [
  { id: 'signups', label: 'Signups', color: '#6366F1', unit: 'count', seed: 101, base: 1180 },
  { id: 'users', label: 'Active users', color: '#22D3EE', unit: 'count', seed: 202, base: 22100 },
  { id: 'revenue', label: 'Revenue', color: '#34D399', unit: 'currency', seed: 303, base: 9400 },
  { id: 'conversion', label: 'Conversion', color: '#FBBF24', unit: 'percent', seed: 404, base: 3.35 },
];

export const MAX_ACTIVE_METRICS = 3;

export function metricDef(id: MetricId): MetricDef {
  return METRICS.find((m) => m.id === id)!;
}

export type Breakdown = 'Plan' | 'Platform' | 'Country' | 'Channel';
export const BREAKDOWNS: readonly Breakdown[] = ['Plan', 'Platform', 'Country', 'Channel'];

export type Segment = 'All users' | 'New this month' | 'Power users' | 'At-risk';
export const SEGMENTS: readonly Segment[] = ['All users', 'New this month', 'Power users', 'At-risk'];

const SEGMENT_SCALE: Record<Segment, number> = {
  'All users': 1,
  'New this month': 0.42,
  'Power users': 0.18,
  'At-risk': 0.09,
};

const BREAKDOWN_SHIFT: Record<Breakdown, number> = { Plan: 11, Platform: 23, Country: 37, Channel: 53 };

export function segmentScale(segment: Segment): number {
  return SEGMENT_SCALE[segment];
}

/** Current-period daily series for a metric, re-sliced by filters. */
export function metricSeries(id: MetricId, points: number, breakdown: Breakdown, segment: Segment): number[] {
  const def = metricDef(id);
  const scale = SEGMENT_SCALE[segment];
  const seed = def.seed + BREAKDOWN_SHIFT[breakdown] + (segment === 'All users' ? 0 : segment.length * 7);
  const start = def.base * scale;
  return seededSeries(seed, points, start, Math.max(start * 0.09, 0.08), start * 0.0022);
}

/** Previous-period echo (~8% lower, different seed). */
export function metricPrevSeries(id: MetricId, points: number, breakdown: Breakdown, segment: Segment): number[] {
  const def = metricDef(id);
  const scale = SEGMENT_SCALE[segment] * 0.92;
  const seed = def.seed + 500 + BREAKDOWN_SHIFT[breakdown];
  const start = def.base * scale;
  return seededSeries(seed, points, start, Math.max(start * 0.08, 0.07), start * 0.0018);
}

export function formatMetric(unit: Unit, v: number): string {
  if (unit === 'currency') return `$${fmtCompact(v)}`;
  if (unit === 'percent') return `${v.toFixed(2)}%`;
  return fmtCompact(v);
}

/* ------------------------------ funnel ----------------------------------- */

export interface FunnelStage {
  name: string;
  value: number;
  /** conversion from previous stage (100 for the first) */
  pct: number;
  note: string;
  color: string;
  timeToNext: string;
  spark: number[];
}

export const FUNNEL_STAGES: readonly FunnelStage[] = [
  { name: 'Visited site', value: 84210, pct: 100, note: '100% of traffic', color: '#6366F1', timeToNext: '3h 12m', spark: seededSeries(11, 14, 80, 6, 0.5) },
  { name: 'Signed up', value: 21846, pct: 25.9, note: '25.9% of visits', color: '#22D3EE', timeToNext: '2d 4h', spark: seededSeries(22, 14, 21, 1.6, 0.12) },
  { name: 'Activated', value: 9422, pct: 43.1, note: '43.1% of signups', color: '#A78BFA', timeToNext: '6d 18h', spark: seededSeries(33, 14, 9.2, 0.8, 0.05) },
  { name: 'Upgraded', value: 3118, pct: 33.1, note: '33.1% of activated', color: '#34D399', timeToNext: '—', spark: seededSeries(44, 14, 3.1, 0.3, 0.02) },
];

/** drop-off between stage i-1 and i */
export const FUNNEL_DROPOFFS = ['−74.1%', '−56.9%', '−66.9%'];

/* ----------------------------- retention --------------------------------- */

export const RETENTION_COHORTS = ['Feb 3', 'Feb 10', 'Feb 17', 'Feb 24', 'Mar 3', 'Mar 10', 'Mar 17', 'Mar 24'];
export const RETENTION_WEEKS = ['W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

const RETENTION_DECAY = [100, 92, 78, 65, 54, 47, 41, 36];

/** Diagonal-decay matrix; newer cohorts have fewer observed weeks (null = future). */
export function retentionMatrix(): (number | null)[][] {
  return RETENTION_COHORTS.map((_, r) => {
    const rnd = mulberry32(1000 + r * 97);
    return RETENTION_WEEKS.map((__, c) => {
      if (c > 7 - r) return null;
      const jitter = (rnd() - 0.5) * 7;
      const v = Math.round(RETENTION_DECAY[c] + jitter + (c > 0 ? (7 - r) * 0.6 : 0));
      return Math.max(9, Math.min(100, v));
    });
  });
}

/* ------------------------------ cohorts ---------------------------------- */

export interface CohortRow {
  month: string;
  size: number;
  m1: number;
  m3: number;
  m6: number;
  ltv: number;
}

export const COHORTS: readonly CohortRow[] = [
  { month: "Oct '24", size: 3412, m1: 68, m3: 52, m6: 41, ltv: 486 },
  { month: "Nov '24", size: 3588, m1: 66, m3: 50, m6: 39, ltv: 452 },
  { month: "Dec '24", size: 3974, m1: 71, m3: 55, m6: 44, ltv: 512 },
  { month: "Jan '25", size: 4216, m1: 69, m3: 53, m6: 42, ltv: 498 },
  { month: "Feb '25", size: 4530, m1: 74, m3: 58, m6: 46, ltv: 546 },
  { month: "Mar '25", size: 4782, m1: 76, m3: 61, m6: 49, ltv: 584 },
];

/** 6-month mini retention curve for the expanded cohort row. */
export function cohortCurve(row: CohortRow): number[] {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return [100, row.m1, lerp(row.m1, row.m3, 0.5), row.m3, lerp(row.m3, row.m6, 0.5), row.m6].map((v) =>
    Math.round(v * 10) / 10,
  );
}

/* ------------------------------- geography ------------------------------- */

export type GeoMode = 'By users' | 'By revenue' | 'By growth';
export const GEO_MODES: readonly GeoMode[] = ['By users', 'By revenue', 'By growth'];

export interface GeoRow {
  code: string;
  name: string;
  share: Record<'users' | 'revenue' | 'growth', number>; // percent
  delta: Record<'users' | 'revenue' | 'growth', number>; // percent delta
}

export const GEO_TOTAL_USERS = 248470;

export const GEO_ROWS: readonly GeoRow[] = [
  { code: 'US', name: 'United States', share: { users: 31.2, revenue: 38.4, growth: 22.1 }, delta: { users: 2.4, revenue: 3.1, growth: 8.2 } },
  { code: 'DE', name: 'Germany', share: { users: 12.8, revenue: 14.2, growth: 9.8 }, delta: { users: 1.1, revenue: 1.8, growth: 4.4 } },
  { code: 'GB', name: 'United Kingdom', share: { users: 9.4, revenue: 11.0, growth: 7.2 }, delta: { users: 0.6, revenue: 1.2, growth: 2.9 } },
  { code: 'IN', name: 'India', share: { users: 8.1, revenue: 4.6, growth: 14.9 }, delta: { users: 5.8, revenue: 6.4, growth: 12.6 } },
  { code: 'BR', name: 'Brazil', share: { users: 6.7, revenue: 3.8, growth: 11.3 }, delta: { users: 4.2, revenue: 4.9, growth: 9.7 } },
  { code: 'FR', name: 'France', share: { users: 5.9, revenue: 6.8, growth: 4.1 }, delta: { users: -0.4, revenue: 0.5, growth: 1.8 } },
  { code: 'JP', name: 'Japan', share: { users: 4.8, revenue: 6.1, growth: 3.2 }, delta: { users: 0.9, revenue: 1.4, growth: 2.2 } },
  { code: 'AU', name: 'Australia', share: { users: 3.6, revenue: 4.0, growth: 2.9 }, delta: { users: -0.2, revenue: 0.3, growth: 1.1 } },
];

export function geoModeKey(mode: GeoMode): 'users' | 'revenue' | 'growth' {
  return mode === 'By users' ? 'users' : mode === 'By revenue' ? 'revenue' : 'growth';
}
