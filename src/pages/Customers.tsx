import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListFilter, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import SummaryStrip from '@/components/customers/SummaryStrip';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerDrawer from '@/components/customers/CustomerDrawer';
import { CUSTOMERS, SEGMENTS, SEGMENT_COUNTS, matchesSegment } from '@/components/customers/data';
import type { Customer, Plan, Segment, Status } from '@/components/customers/data';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { cn } from '@/lib/utils';

/**
 * /customers — segment chips, sortable table with live health scores,
 * detail drawer with timeline (design/customers.md).
 */

const PLANS: Plan[] = ['Enterprise', 'Scale', 'Starter'];
const STATUSES: Status[] = ['Active', 'Trialing', 'Past due', 'Churned'];
const HEALTH_RANGES = [
  { key: 'healthy', label: 'Healthy · ≥70', test: (h: number) => h >= 70 },
  { key: 'mid', label: 'Needs work · 40–69', test: (h: number) => h >= 40 && h < 70 },
  { key: 'low', label: 'Critical · <40', test: (h: number) => h < 40 },
] as const;

export default function Customers() {
  const { live } = useLiveMetrics();
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [flashes, setFlashes] = useState<Record<number, number>>({});
  const [segment, setSegment] = useState<Segment>('All');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [planFilter, setPlanFilter] = useState<Plan[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [healthFilter, setHealthFilter] = useState<string[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const flashCounter = useRef(0);

  // 150ms search debounce
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), 150);
    return () => window.clearTimeout(id);
  }, [query]);

  // live health ticking — ±1 on 1–2 random rows every ~4s
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      setCustomers((cs) => {
        const next = [...cs];
        const count = 1 + Math.floor(Math.random() * 2);
        const hit: number[] = [];
        for (let k = 0; k < count; k++) {
          const i = Math.floor(Math.random() * next.length);
          const delta = Math.random() < 0.5 ? -1 : 1;
          next[i] = { ...next[i], health: Math.max(5, Math.min(99, next[i].health + delta)) };
          hit.push(next[i].id);
        }
        flashCounter.current += 1;
        const key = flashCounter.current;
        setFlashes((f) => {
          const copy = { ...f };
          hit.forEach((cid) => (copy[cid] = key));
          return copy;
        });
        // keep the open drawer in sync
        setSelected((sel) => (sel ? (next.find((c) => c.id === sel.id) ?? sel) : sel));
        return next;
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, [live]);

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        if (!matchesSegment(c, segment)) return false;
        if (debounced && !`${c.name} ${c.domain}`.toLowerCase().includes(debounced)) return false;
        if (planFilter.length > 0 && !planFilter.includes(c.plan)) return false;
        if (statusFilter.length > 0 && !statusFilter.includes(c.status)) return false;
        if (healthFilter.length > 0 && !HEALTH_RANGES.some((r) => healthFilter.includes(r.key) && r.test(c.health))) return false;
        return true;
      }),
    [customers, segment, debounced, planFilter, statusFilter, healthFilter],
  );

  const activeFilterCount = planFilter.length + statusFilter.length + healthFilter.length;
  const resetKey = `${segment}|${debounced}|${planFilter.join()}|${statusFilter.join()}|${healthFilter.join()}`;

  const resetFilters = () => {
    setQuery('');
    setSegment('All');
    setPlanFilter([]);
    setStatusFilter([]);
    setHealthFilter([]);
  };

  const toggleIn = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-5">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="mr-auto flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink-1">Customers</h1>
              <span className="rounded-pill bg-brand-soft px-2 py-0.5 font-mono text-[11px] font-medium text-brand">
                {SEGMENT_COUNTS.All.toLocaleString('en-US')} total
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink-2">Segments, health scores and account timelines.</p>
          </div>
        </div>

        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers…"
            aria-label="Search customers"
            className="w-56 max-w-full rounded-md border border-line-strong bg-surface py-2 pl-9 pr-3 text-[13px] text-ink-1 outline-none transition-colors duration-150 placeholder:text-ink-3 focus:border-brand"
          />
        </div>

        {/* filter popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors duration-150',
              activeFilterCount > 0 ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink-1',
            )}
          >
            <ListFilter size={15} />
            Filter
            {activeFilterCount > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-pill bg-brand px-1 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {filterOpen && (
              <>
                <button type="button" aria-label="Close filters" className="fixed inset-0 z-30 cursor-default" onClick={() => setFilterOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-40 mt-1.5 w-60 rounded-md border border-line bg-surface p-3 shadow-pop"
                >
                  <div className="mb-3">
                    <p className="v-label mb-1.5">Plan</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PLANS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleIn(planFilter, item, setPlanFilter)}
                          aria-pressed={planFilter.includes(item)}
                          className={cn(
                            'rounded-pill border px-2 py-0.5 text-[11.5px] font-medium transition-colors duration-150',
                            planFilter.includes(item) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2 hover:bg-surface-2',
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="v-label mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleIn(statusFilter, item, setStatusFilter)}
                          aria-pressed={statusFilter.includes(item)}
                          className={cn(
                            'rounded-pill border px-2 py-0.5 text-[11.5px] font-medium transition-colors duration-150',
                            statusFilter.includes(item) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2 hover:bg-surface-2',
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="v-label mb-1.5">Health</p>
                    <div className="flex flex-wrap gap-1.5">
                      {HEALTH_RANGES.map((r) => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => toggleIn(healthFilter, r.key, setHealthFilter)}
                          aria-pressed={healthFilter.includes(r.key)}
                          className={cn(
                            'rounded-pill border px-2 py-0.5 text-[11.5px] font-medium transition-colors duration-150',
                            healthFilter.includes(r.key) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2 hover:bg-surface-2',
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlanFilter([]);
                        setStatusFilter([]);
                        setHealthFilter([]);
                      }}
                      className="w-full rounded-md border border-line px-2 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2"
                    >
                      Clear all filters
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => toast('Invite flow coming soon', { description: 'Add customers manually once provisioning ships.' })}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-card transition-colors duration-150 hover:bg-brand-strong"
        >
          <UserPlus size={15} />
          Add customer
        </motion.button>
      </motion.div>

      {/* segment chips */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Customer segments">
        {SEGMENTS.map((s, i) => {
          const active = s === segment;
          return (
            <motion.button
              key={s}
              type="button"
              role="tab"
              aria-selected={active}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
              onClick={() => setSegment(s)}
              className={cn(
                'rounded-pill px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150',
                active ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-surface-2',
              )}
            >
              {s} <span className={cn('font-mono text-[11px]', active ? 'text-brand' : 'text-ink-3')}>({SEGMENT_COUNTS[s].toLocaleString('en-US')})</span>
            </motion.button>
          );
        })}
      </div>

      <SummaryStrip />

      <CustomerTable
        customers={filtered}
        flashes={flashes}
        resetKey={resetKey}
        onRowClick={setSelected}
        onResetFilters={resetFilters}
      />

      <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
