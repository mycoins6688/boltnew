import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import HealthBar from './HealthBar';
import { fmtRelative } from './data';
import type { Customer, Plan, Status } from './data';
import { avatarGradient, initials } from '@/lib/live';
import { cn } from '@/lib/utils';

/**
 * Customer table — sortable, paginated, live-ticking health bars
 * (design/customers.md §3). Row click opens the detail drawer.
 */

type SortKey = 'name' | 'plan' | 'mrr' | 'health' | 'lastActive' | 'status';

const PLAN_STYLE: Record<Plan, string> = {
  Enterprise: 'bg-[rgba(139,92,246,0.12)] text-[#8B5CF6] dark:text-[#A78BFA]',
  Scale: 'bg-brand-soft text-brand',
  Starter: 'bg-surface-2 text-ink-2',
};

const STATUS_STYLE: Record<Status, string> = {
  Active: 'bg-[rgba(14,169,104,0.10)] text-success',
  Trialing: 'bg-[rgba(2,132,199,0.10)] text-info',
  'Past due': 'bg-[rgba(217,119,6,0.10)] text-warning',
  Churned: 'bg-[rgba(225,29,72,0.10)] text-danger',
};

const COLUMNS: Array<{ key: SortKey | null; label: string; align?: 'right' }> = [
  { key: 'name', label: 'Customer' },
  { key: 'plan', label: 'Plan' },
  { key: 'mrr', label: 'MRR', align: 'right' },
  { key: 'health', label: 'Health' },
  { key: 'lastActive', label: 'Last active' },
  { key: 'status', label: 'Status' },
  { key: null, label: '' },
];

export default function CustomerTable({
  customers,
  flashes,
  resetKey,
  onRowClick,
  onResetFilters,
}: {
  customers: Customer[];
  flashes: Record<number, number>;
  resetKey: string;
  onRowClick: (c: Customer) => void;
  onResetFilters: () => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('mrr');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // reset pagination when filters/search/segment change (adjust during render)
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  const sorted = useMemo(() => {
    const arr = [...customers];
    const dir = sortDir;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'plan':
          return a.plan.localeCompare(b.plan) * dir;
        case 'mrr':
          return (a.mrr - b.mrr) * dir;
        case 'health':
          return (a.health - b.health) * dir;
        case 'lastActive':
          return (a.lastActiveMin - b.lastActiveMin) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        default:
          return 0;
      }
    });
    return arr;
  }, [customers, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const clampedPage = Math.min(page, pageCount);
  const rows = sorted.slice((clampedPage - 1) * perPage, clampedPage * perPage);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'status' || key === 'plan' ? 1 : -1);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card overflow-hidden"
      aria-label="Customer table"
    >
      {customers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <img src="/empty-search.svg" alt="" className="h-32 w-auto" />
          <div>
            <p className="text-[15px] font-semibold text-ink-1">No customers found</p>
            <p className="mt-1 text-[13px] text-ink-3">Adjust your search or filters to find what you're looking for.</p>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-1 rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-1 shadow-card transition-colors duration-150 hover:bg-surface-2"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-line">
                  {COLUMNS.map((col, i) => (
                    <th key={i} className={cn('px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3', col.align === 'right' && 'text-right')}>
                      {col.key ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key as SortKey)}
                          className={cn(
                            'inline-flex items-center gap-1 uppercase tracking-[0.04em] transition-colors duration-150 hover:text-ink-1',
                            col.align === 'right' && 'flex-row-reverse',
                            sortKey === col.key && 'text-ink-1',
                          )}
                        >
                          {col.label}
                          <ChevronDown
                            size={12}
                            className={cn(
                              'transition-transform duration-[180ms]',
                              sortKey === col.key ? 'opacity-100' : 'opacity-0',
                              sortKey === col.key && sortDir === 1 && 'rotate-180',
                            )}
                          />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => {
                  const flash = flashes[c.id] ?? 0;
                  return (
                    <motion.tr
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1], layout: { type: 'spring', stiffness: 350, damping: 32 } }}
                      onClick={() => onRowClick(c)}
                      className="group relative cursor-pointer border-b border-line last:border-0 hover:bg-surface-2"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: avatarGradient(c.name) }}>
                            {initials(c.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink-1">{c.name}</p>
                            <p className="truncate font-mono text-[11px] text-ink-3">{c.domain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-medium', PLAN_STYLE[c.plan])}>{c.plan}</span>
                      </td>
                      <td className="relative px-5 py-2.5 text-right font-mono text-[12.5px] text-ink-1 tnum">
                        {flash > 0 && (
                          <motion.span
                            key={flash}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="pointer-events-none absolute inset-0 bg-brand-soft"
                          />
                        )}
                        ${c.mrr.toLocaleString('en-US')}
                      </td>
                      <td className="relative px-5 py-2.5">
                        {flash > 0 && (
                          <motion.span
                            key={flash}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="pointer-events-none absolute inset-0 bg-brand-soft"
                          />
                        )}
                        <HealthBar score={c.health} />
                      </td>
                      <td className="px-5 py-2.5 text-[12.5px] text-ink-2">{fmtRelative(c.lastActiveMin)}</td>
                      <td className="px-5 py-2.5">
                        <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-medium', STATUS_STYLE[c.status])}>{c.status}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <ChevronRight size={15} className="ml-auto text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink-1" />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* pagination footer */}
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
            <p className="text-[12px] text-ink-3">
              Page {clampedPage} of {pageCount} · {sorted.length} customers
            </p>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-[12px] text-ink-3" htmlFor="rows-per-page">Rows per page</label>
              <select
                id="rows-per-page"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-line-strong bg-surface px-2 py-1 font-mono text-[12px] text-ink-1 outline-none focus:border-brand"
              >
                {[8, 12, 24].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Previous page"
                disabled={clampedPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-2 transition-colors duration-150 hover:bg-surface-2 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={clampedPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-2 transition-colors duration-150 hover:bg-surface-2 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}
