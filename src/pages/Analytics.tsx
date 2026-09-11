import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Calendar, ChevronDown, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import CohortTable from '@/components/analytics/CohortTable';
import ComparisonChart from '@/components/analytics/ComparisonChart';
import ConversionFunnel from '@/components/analytics/ConversionFunnel';
import GeoBreakdown from '@/components/analytics/GeoBreakdown';
import RetentionHeatmap from '@/components/analytics/RetentionHeatmap';
import type { Breakdown, MetricId, Segment } from '@/components/analytics/data';
import { BREAKDOWNS, MAX_ACTIVE_METRICS, METRICS, SEGMENTS, metricDef } from '@/components/analytics/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * /analytics — deep-dive explorer (analytics.md): metric-chip comparison
 * chart with zoom brush, conversion funnel, retention heatmap, cohort table,
 * geography breakdown. All filters re-slice the dummy datasets.
 */

type Range = 'Last 7 days' | 'Last 30 days' | 'Last 90 days';
const RANGES: readonly Range[] = ['Last 7 days', 'Last 30 days', 'Last 90 days'];
const RANGE_CONFIG: Record<Range, { points: number; stepMs: number }> = {
  'Last 7 days': { points: 28, stepMs: 6 * 3_600_000 },
  'Last 30 days': { points: 60, stepMs: 12 * 3_600_000 },
  'Last 90 days': { points: 90, stepMs: 24 * 3_600_000 },
};

const SAVED_VIEWS = ['Activation deep-dive', 'Q1 board pack'] as const;

export default function Analytics() {
  const [activeMetrics, setActiveMetrics] = useState<MetricId[]>(['signups', 'users', 'revenue']);
  const [breakdown, setBreakdown] = useState<Breakdown>('Plan');
  const [segment, setSegment] = useState<Segment>('All users');
  const [range, setRange] = useState<Range>('Last 90 days');
  const [compare, setCompare] = useState(true);

  const toggleMetric = (id: MetricId) => {
    setActiveMetrics((cur) => {
      if (cur.includes(id)) {
        if (cur.length === 1) {
          toast('At least one metric stays on the chart');
          return cur;
        }
        return cur.filter((m) => m !== id);
      }
      if (cur.length >= MAX_ACTIVE_METRICS) {
        toast(`Up to ${MAX_ACTIVE_METRICS} metrics — deselect one to add ${metricDef(id).label}`);
        return cur;
      }
      return [...cur, id];
    });
  };

  const { points, stepMs } = RANGE_CONFIG[range];

  return (
    <div>
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end gap-3 pb-4"
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink-1">Analytics</h1>
          <p className="text-[13px] text-ink-3">Slice product usage by any dimension.</p>
        </div>

        {/* saved views */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink-2 shadow-card transition-colors duration-150 hover:border-line-strong hover:text-ink-1"
            >
              <Bookmark size={14} /> Saved views <ChevronDown size={13} className="text-ink-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {SAVED_VIEWS.map((v) => (
              <DropdownMenuItem key={v} onSelect={() => toast.success(`View applied: ${v}`)}>
                {v}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.success('Current view saved to your workspace')}>
              <Plus size={14} className="mr-2" /> Save current view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* date range */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink-2 shadow-card transition-colors duration-150 hover:border-line-strong hover:text-ink-1"
            >
              <Calendar size={14} /> {range} <ChevronDown size={13} className="text-ink-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {RANGES.map((r) => (
              <DropdownMenuItem key={r} onSelect={() => setRange(r)}>
                <span className={cn(r === range && 'font-semibold text-brand')}>{r}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* compare toggle */}
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 shadow-card">
          <Switch checked={compare} onCheckedChange={setCompare} aria-label="Compare vs previous period" />
          <span className="text-[13px] font-medium text-ink-2">vs previous period</span>
        </label>

        {/* new insight */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => toast.success('Insight draft created — check Reports')}
          className="flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-card transition-colors duration-150 hover:bg-brand-strong"
        >
          <Sparkles size={14} /> New insight
        </motion.button>
      </motion.div>

      {/* sticky filter bar */}
      <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-line bg-surface/80 px-4 py-2.5 backdrop-blur-md lg:-mx-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {METRICS.map((m, i) => {
            const active = activeMetrics.includes(m.id);
            return (
              <motion.button
                key={m.id}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                onClick={() => toggleMetric(m.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[12px] font-medium transition-all duration-200',
                  active
                    ? 'border-transparent text-ink-1'
                    : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink-2',
                )}
                style={active ? { backgroundColor: `color-mix(in srgb, ${m.color} 14%, transparent)` } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full transition-transform duration-200"
                  style={{ background: m.color, transform: active ? 'scale(1.2)' : 'scale(1)' }}
                />
                {m.label}
              </motion.button>
            );
          })}

          <div className="mx-1 hidden h-5 w-px bg-line sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-3">Breakdown by</span>
            <Select value={breakdown} onValueChange={(v) => setBreakdown(v as Breakdown)}>
              <SelectTrigger className="h-8 w-[118px] border-line bg-surface text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BREAKDOWNS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-3">Segment</span>
            <Select value={segment} onValueChange={(v) => setSegment(v as Segment)}>
              <SelectTrigger className="h-8 w-[148px] border-line bg-surface text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* surfaces */}
      <div className="grid grid-cols-12 gap-4">
        <ComparisonChart
          metrics={activeMetrics}
          compare={compare}
          points={points}
          stepMs={stepMs}
          rangeLabel={range}
          breakdown={breakdown}
          segment={segment}
        />
        <ConversionFunnel segment={segment} index={1} />
        <RetentionHeatmap index={2} />
        <CohortTable index={1} />
        <GeoBreakdown index={2} />
      </div>
    </div>
  );
}
