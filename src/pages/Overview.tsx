import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Download, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import KpiTile from '@/components/KpiTile';
import ActiveNow from '@/components/overview/ActiveNow';
import LiveFeed from '@/components/overview/LiveFeed';
import RevenueChart from '@/components/overview/RevenueChart';
import TopPages from '@/components/overview/TopPages';
import TrafficDonut from '@/components/overview/TrafficDonut';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { fmtCurrency, fmtNumber } from '@/lib/live';
import { cn } from '@/lib/utils';

const RANGES = ['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom'] as const;

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4" aria-label="Loading dashboard">
      <div className="col-span-12 space-y-2">
        <div className="v-skeleton h-7 w-40" />
        <div className="v-skeleton h-4 w-72" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="v-skeleton h-[118px] w-full rounded-lg" />
        </div>
      ))}
      <div className="col-span-12 xl:col-span-8"><div className="v-skeleton h-[420px] w-full rounded-lg" /></div>
      <div className="col-span-12 xl:col-span-4"><div className="v-skeleton h-[420px] w-full rounded-lg" /></div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="col-span-12 md:col-span-6 xl:col-span-4">
          <div className="v-skeleton h-[320px] w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const {
    live, toggleLive, tick,
    mrr, activeUsers, conversionRate, sessionSeconds,
    sparkMrr, sparkUsers, sparkConv, sparkSession,
  } = useLiveMetrics();
  const [range, setRange] = useState<(typeof RANGES)[number]>('Last 30 days');
  const [loading, setLoading] = useState(true);

  // 800ms skeleton shimmer to simulate fetch, then content staggers in
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 800);
    return () => window.clearTimeout(id);
  }, []);

  if (loading) return <OverviewSkeleton />;

  const minutes = Math.floor(sessionSeconds / 60);
  const seconds = sessionSeconds % 60;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ——— Page header ——— */}
      <div className="col-span-12 flex flex-wrap items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink-1">Overview</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Welcome back, Ava — here's what's happening at Acme Inc.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-2"
        >
          {/* date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink-1 transition-colors duration-150 hover:border-line-strong"
              >
                <Calendar size={15} className="text-ink-3" />
                {range}
                <ChevronDown size={14} className="text-ink-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-2.5 py-1.5 text-left text-[13px] transition-colors duration-100',
                    r === range ? 'bg-brand-soft font-medium text-brand' : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1',
                  )}
                >
                  {r}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* live toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={live}
            onClick={toggleLive}
            className={cn(
              'flex h-9 items-center gap-2 rounded-pill border px-3 text-[13px] font-medium transition-colors duration-200',
              live ? 'border-line bg-surface text-ink-1' : 'border-line bg-surface-2 text-ink-3',
            )}
          >
            {live ? <span className="v-live-dot" /> : <span className="h-2 w-2 rounded-full bg-ink-3" />}
            Live
            {live ? <Pause size={13} className="text-ink-3" /> : <Play size={13} className="text-ink-3" />}
          </button>

          {/* export */}
          <button
            type="button"
            onClick={() => toast.success("Report queued — we'll email it to ava@acme.io")}
            className="flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink-1 transition-all duration-150 hover:border-line-strong hover:bg-surface-2 active:scale-[0.97]"
          >
            <Download size={15} className="text-ink-3" />
            Export
          </button>
        </motion.div>
      </div>

      {/* ——— KPI tiles ——— */}
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiTile
          index={0}
          label="Monthly recurring revenue"
          value={mrr}
          format={(v) => fmtCurrency(Math.round(v))}
          delta="12.4% vs last month"
          deltaDirection="up"
          sparkData={sparkMrr}
          sparkTone="success"
          flashKey={tick}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiTile
          index={1}
          label="Active users"
          value={activeUsers}
          format={(v) => fmtNumber(Math.round(v))}
          delta="8.1% vs last month"
          deltaDirection="up"
          sparkData={sparkUsers}
          sparkTone="accent"
          live
          flashKey={tick}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiTile
          index={2}
          label="Conversion rate"
          value={conversionRate}
          format={(v) => `${v.toFixed(2)}%`}
          delta="0.4% vs last month"
          deltaDirection="down"
          sparkData={sparkConv}
          sparkTone="danger"
          flashKey={tick}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiTile
          index={3}
          label="Avg. session duration"
          value={sessionSeconds}
          format={() => `${minutes}m ${String(seconds).padStart(2, '0')}s`}
          delta="6.2% vs last month"
          deltaDirection="up"
          sparkData={sparkSession}
          sparkTone="success"
          flashKey={tick}
        />
      </div>

      {/* ——— Revenue + live feed ——— */}
      <RevenueChart />
      <LiveFeed />

      {/* ——— Bottom row ——— */}
      <TrafficDonut />
      <ActiveNow />
      <TopPages />
    </div>
  );
}
