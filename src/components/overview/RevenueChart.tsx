import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format as formatDate } from 'date-fns';
import { Copy, FileDown, MoreHorizontal, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SegmentedControl from '@/components/SegmentedControl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { useTheme } from '@/hooks/useTheme';
import { fmtCompact, fmtCurrency, fmtNumber } from '@/lib/live';
import { cn } from '@/lib/utils';

type Window = '1H' | '24H' | '7D' | '30D';
const WINDOWS: readonly Window[] = ['1H', '24H', '7D', '30D'];
/** step per point, ms */
const STEP: Record<Window, number> = {
  '1H': 60_000,
  '24H': 24 * 60_000,
  '7D': 2.8 * 3_600_000,
  '30D': 12 * 3_600_000,
};
const FMT: Record<Window, string> = { '1H': 'HH:mm', '24H': 'HH:mm', '7D': 'EEE HH:mm', '30D': 'MMM d' };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p: any) => p.dataKey === 'current');
  const prev = payload.find((p: any) => p.dataKey === 'previous');
  const delta = cur && prev ? cur.value - prev.value : 0;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-pop">
      <div className="mb-1 font-mono text-[10px] text-ink-3">{formatDate(label as number, 'MMM d, HH:mm')}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.dataKey === 'current' ? 'var(--accent)' : 'var(--text-3)' }} />
          <span className="text-ink-2">{p.dataKey === 'current' ? 'This period' : 'Previous'}</span>
          <span className="tnum ml-auto font-mono font-medium text-ink-1">{fmtCurrency(p.value)}</span>
        </div>
      ))}
      {cur && prev && (
        <div className={cn('mt-1 border-t border-line pt-1 text-right font-mono text-[11px]', delta >= 0 ? 'text-success' : 'text-danger')}>
          {delta >= 0 ? '+' : '-'}{fmtCurrency(Math.abs(delta))}
        </div>
      )}
    </div>
  );
}

function FlashStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 px-4 first:pl-0 last:pr-0">
      <span className="text-[12px] text-ink-3">{label}</span>
      <motion.span
        key={value}
        initial={{ backgroundColor: 'var(--accent-soft)' }}
        animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.6 }}
        className="tnum rounded-sm px-1 font-mono text-[13px] font-semibold text-ink-1"
      >
        {value}
      </motion.span>
    </div>
  );
}

export default function RevenueChart() {
  const { revenueSeries, revenuePrevSeries, eventsPerSec, signupsToday, apiCalls } = useLiveMetrics();
  const { resolvedTheme } = useTheme();
  const [win, setWin] = useState<Window>('1H');
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [dimmed, setDimmed] = useState<string | null>(null);

  const data = useMemo(() => {
    const now = Date.now();
    const step = STEP[win];
    const scale = win === '1H' ? 1 : win === '24H' ? 14 : win === '7D' ? 92 : 340;
    return revenueSeries.map((v, i) => ({
      t: now - (revenueSeries.length - 1 - i) * step,
      current: Math.round(v * scale),
      previous: Math.round((revenuePrevSeries[i] ?? v) * scale * 0.94),
    }));
  }, [revenueSeries, revenuePrevSeries, win]);

  const seriesOpacity = (key: string) => {
    if (hidden[key]) return 0;
    if (dimmed && dimmed !== key) return 0.3;
    return 1;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card col-span-12 flex flex-col xl:col-span-8"
      aria-label="Real-time revenue chart"
    >
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Revenue</h2>
          <p className="text-[12px] text-ink-3">Streaming · updates every 2s</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {(['current', 'previous'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setHidden((h) => ({ ...h, [k]: !h[k] }))}
              onMouseEnter={() => setDimmed(k)}
              onMouseLeave={() => setDimmed(null)}
              className={cn(
                'flex items-center gap-1.5 rounded-pill border border-line px-2 py-1 transition-opacity duration-200',
                hidden[k] && 'opacity-40',
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: k === 'current' ? 'var(--accent)' : 'var(--text-3)' }}
              />
              <span className="text-ink-2">{k === 'current' ? 'This period' : 'Previous'}</span>
            </button>
          ))}
        </div>
        <SegmentedControl id="rev-window" options={WINDOWS} value={win} onChange={setWin} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Chart options" className="grid h-8 w-8 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink-1">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => toast.success('Chart exported as PNG')}>
              <FileDown size={15} className="mr-2" /> Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.info('Raw data view coming right up')}>
              <Table2 size={15} className="mr-2" /> View raw data
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success('Link copied to clipboard')}>
              <Copy size={15} className="mr-2" /> Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* chart */}
      <div className="h-[300px] px-2 pt-4" key={resolvedTheme}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(t: number) => formatDate(t, FMT[win])}
              tick={{ fill: 'var(--text-3)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              minTickGap={48}
            />
            <YAxis
              tickFormatter={(v: number) => `$${fmtCompact(v)}`}
              tick={{ fill: 'var(--text-3)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickCount={4}
              width={56}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="var(--text-3)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              fill="none"
              dot={false}
              strokeOpacity={seriesOpacity('previous')}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#revFill)"
              fillOpacity={seriesOpacity('current')}
              strokeOpacity={seriesOpacity('current')}
              animationDuration={800}
              activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
              dot={(props: any) => {
                const { cx, cy, index, key } = props;
                if (index !== data.length - 1) return <g key={key ?? index} />;
                return (
                  <circle
                    key={key ?? index}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="var(--accent)"
                    stroke="var(--surface)"
                    strokeWidth={2}
                    style={resolvedTheme === 'dark' ? { filter: 'drop-shadow(0 0 6px rgba(129,140,248,.8))' } : undefined}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* footer micro-stats */}
      <div className="mt-auto flex flex-wrap items-center divide-x divide-line border-t border-line px-5 py-3">
        <FlashStat label="Events/sec" value={fmtNumber(eventsPerSec)} />
        <FlashStat label="Signups today" value={fmtNumber(signupsToday)} />
        <FlashStat label="API calls" value={`${apiCalls.toFixed(1)}M`} />
      </div>
    </motion.section>
  );
}
