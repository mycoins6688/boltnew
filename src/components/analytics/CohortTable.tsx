import { Fragment, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { fmtCurrency, fmtNumber } from '@/lib/live';
import { cn } from '@/lib/utils';
import type { CohortRow } from './data';
import { COHORTS, cohortCurve } from './data';

/**
 * Cohort table (analytics.md §5) — sortable columns, best/worst cell tints,
 * and inline accordion expansion with a 6-month mini area chart per cohort.
 */

type SortKey = 'size' | 'm1' | 'm3' | 'm6' | 'ltv';

const COLUMNS: ReadonlyArray<{ key: SortKey; label: string; format: (r: CohortRow) => string }> = [
  { key: 'size', label: 'Size', format: (r) => fmtNumber(r.size) },
  { key: 'm1', label: 'M1 retention', format: (r) => `${r.m1}%` },
  { key: 'm3', label: 'M3', format: (r) => `${r.m3}%` },
  { key: 'm6', label: 'M6', format: (r) => `${r.m6}%` },
  { key: 'ltv', label: 'LTV', format: (r) => fmtCurrency(r.ltv) },
];

function MiniCurve({ row }: { row: CohortRow }) {
  const data = cohortCurve(row);
  const w = 560;
  const h = 96;
  const pad = 6;
  const min = Math.min(...data) - 4;
  const max = 104;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  const id = `cohort-${row.month.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div className="px-5 pb-4 pt-1">
      <div className="mb-2 flex items-center justify-between text-[11px] text-ink-3">
        <span>6-month retention curve · {row.month} cohort</span>
        <span className="font-mono">
          M0 100% → M6 {row.m6}%
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label={`Retention curve for ${row.month}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <motion.path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.5} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-3">
        {['M0', 'M1', 'M2', 'M3', 'M4', 'M6'].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

export default function CohortTable({ index = 0 }: { index?: number }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!sort) return [...COHORTS];
    return [...COHORTS].sort((a, b) => (sort.dir === 'asc' ? a[sort.key] - b[sort.key] : b[sort.key] - a[sort.key]));
  }, [sort]);

  // best/worst index per numeric column (computed on unsorted cohorts, stable across sorts)
  const extremes = useMemo(() => {
    const out = {} as Record<SortKey, { best: number; worst: number }>;
    for (const col of COLUMNS) {
      let best = 0;
      let worst = 0;
      COHORTS.forEach((r, i) => {
        if (r[col.key] > COHORTS[best][col.key]) best = i;
        if (r[col.key] < COHORTS[worst][col.key]) worst = i;
      });
      out[col.key] = { best, worst };
    }
    return out;
  }, []);

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s?.key !== key ? { key, dir: 'desc' } : s.dir === 'desc' ? { key, dir: 'asc' } : null,
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card col-span-12 flex flex-col lg:col-span-7"
      aria-label="Cohort table"
    >
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Cohorts</h2>
        <p className="text-[12px] text-ink-3">Monthly signup cohorts · retention &amp; lifetime value</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">Cohort</th>
              {COLUMNS.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th key={col.key} className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        'flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.04em] transition-colors duration-150',
                        active ? 'text-ink-1' : 'text-ink-3 hover:text-ink-2',
                      )}
                    >
                      {col.label}
                      <span
                        className="inline-flex transition-transform duration-200"
                        style={{ transform: active && sort?.dir === 'asc' ? 'rotate(180deg)' : 'none' }}
                      >
                        {active ? <ChevronUp size={12} /> : <ChevronDown size={12} className="opacity-50" />}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const origIdx = COHORTS.indexOf(row);
              const isOpen = expanded === row.month;
              return (
                <Fragment key={row.month}>
                  <motion.tr
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + ri * 0.06, duration: 0.35 }}
                    onClick={() => setExpanded(isOpen ? null : row.month)}
                    className={cn(
                      'cursor-pointer border-b border-line transition-colors duration-150',
                      isOpen ? 'bg-brand-soft' : 'hover:bg-surface-2',
                    )}
                  >
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-1">{row.month}</td>
                    {COLUMNS.map((col) => {
                      const { best, worst } = extremes[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn('tnum px-3 py-3 text-[13px] text-ink-2', col.key === 'ltv' && 'font-mono')}
                        >
                          <span
                            className={cn(
                              'rounded-sm px-1.5 py-0.5',
                              origIdx === best && 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success',
                              origIdx === worst && 'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger',
                            )}
                          >
                            {col.format(row)}
                          </span>
                        </td>
                      );
                    })}
                  </motion.tr>
                  <AnimatePresence>
                    {isOpen && (
                      <tr key={`${row.month}-detail`}>
                        <td colSpan={COLUMNS.length + 1} className="border-b border-line bg-surface-2/50">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <MiniCurve row={row} />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line px-5 py-3 text-[11px] text-ink-3">
        Click a row to expand its retention curve · best / worst cells highlighted per column
      </div>
    </motion.section>
  );
}
