import { useEffect, useMemo, useState } from 'react';
import { format as formatDate } from 'date-fns';
import { motion } from 'framer-motion';
import { FileDown, MoreHorizontal, RotateCcw, Table2 } from 'lucide-react';
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { fmtNumber } from '@/lib/live';
import { cn } from '@/lib/utils';
import type { Breakdown, MetricId, Segment } from './data';
import { formatMetric, metricDef, metricPrevSeries, metricSeries } from './data';

/**
 * Comparison chart (analytics.md §2) — multi-metric line chart, per-metric
 * y-scales, dashed previous-period echoes, isolating legend chips, and a
 * brush strip to drag-select a zoom window.
 */

interface ComparisonChartProps {
  metrics: MetricId[];
  compare: boolean;
  points: number;
  /** ms between consecutive points */
  stepMs: number;
  rangeLabel: string;
  breakdown: Breakdown;
  segment: Segment;
  index?: number;
}

function ComparisonTooltip({ active, payload, label, metrics, compare, stepMs }: any) {
  if (!active || !payload?.length) return null;
  const dateFmt = stepMs >= 86_400_000 ? 'MMM d, yyyy' : 'MMM d, HH:mm';
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-pop">
      <div className="mb-1 font-mono text-[10px] text-ink-3">{formatDate(label as number, dateFmt)}</div>
      {(metrics as MetricId[]).map((id) => {
        const def = metricDef(id);
        const cur = payload.find((p: any) => p.dataKey === id);
        const prev = payload.find((p: any) => p.dataKey === `prev_${id}`);
        if (!cur) return null;
        const delta = prev ? ((cur.value - prev.value) / (prev.value || 1)) * 100 : null;
        return (
          <div key={id} className="flex items-center gap-2 py-0.5 text-[12px]">
            <span className="h-2 w-2 rounded-full" style={{ background: def.color }} />
            <span className="text-ink-2">{def.label}</span>
            <span className="tnum ml-auto pl-4 font-mono font-medium text-ink-1">
              {formatMetric(def.unit, cur.value)}
            </span>
            {compare && delta !== null && (
              <span className={cn('tnum font-mono text-[11px]', delta >= 0 ? 'text-success' : 'text-danger')}>
                {delta >= 0 ? '+' : ''}
                {delta.toFixed(1)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ComparisonChart({
  metrics,
  compare,
  points,
  stepMs,
  rangeLabel,
  breakdown,
  segment,
  index = 0,
}: ComparisonChartProps) {
  const { signupsToday } = useLiveMetrics();
  const [isolated, setIsolated] = useState<MetricId | null>(null);
  const [zoom, setZoom] = useState<[number, number]>([0, points - 1]);

  // reset the brush window whenever the dataset length / filters change
  useEffect(() => {
    setZoom([0, points - 1]);
  }, [points, breakdown, segment]);

  useEffect(() => {
    if (isolated && !metrics.includes(isolated)) setIsolated(null);
  }, [metrics, isolated]);

  const data = useMemo(() => {
    const now = Date.now();
    const step = stepMs;
    const series = Object.fromEntries(metrics.map((id) => [id, metricSeries(id, points, breakdown, segment)]));
    const prev = Object.fromEntries(metrics.map((id) => [id, metricPrevSeries(id, points, breakdown, segment)]));
    return Array.from({ length: points }, (_, i) => {
      const row: Record<string, number> = { t: now - (points - 1 - i) * step };
      for (const id of metrics) {
        row[id] = Math.round((series as Record<string, number[]>)[id][i] * 100) / 100;
        row[`prev_${id}`] = Math.round((prev as Record<string, number[]>)[id][i] * 100) / 100;
      }
      return row;
    });
  }, [metrics, points, stepMs, breakdown, segment]);

  const focus = isolated ?? metrics[0];
  const focusDef = metricDef(focus);
  const zoomed = zoom[0] > 0 || zoom[1] < points - 1;
  const brushKey = metrics.join(',');

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card col-span-12 flex flex-col"
      aria-label="Metric comparison chart"
    >
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Metric comparison</h2>
          <p className="text-[12px] text-ink-3">
            {rangeLabel} · {segment} · by {breakdown}
            {compare ? ' · vs previous period' : ''}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[12px] text-ink-3">Signups today</span>
          <motion.span
            key={signupsToday}
            initial={{ backgroundColor: 'var(--accent-soft)' }}
            animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
            transition={{ duration: 0.6 }}
            className="tnum rounded-sm px-1 font-mono text-[13px] font-semibold text-ink-1"
          >
            {fmtNumber(signupsToday)}
          </motion.span>
        </div>

        {zoomed && (
          <button
            type="button"
            onClick={() => setZoom([0, points - 1])}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
          >
            <RotateCcw size={13} /> Reset zoom
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Chart options"
              className="rounded-md p-1.5 text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => toast.success('Chart exported as PNG')}>
              <FileDown size={14} className="mr-2" /> Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast('Raw data opened in a new panel')}>
              <Table2 size={14} className="mr-2" /> View raw data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* legend / isolate chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3">
        {metrics.map((id) => {
          const def = metricDef(id);
          const isIsolated = isolated === id;
          const dim = isolated !== null && !isIsolated;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setIsolated(isIsolated ? null : id)}
              title={isIsolated ? 'Show all series' : 'Isolate this series'}
              className={cn(
                'flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                isIsolated
                  ? 'border-line-strong bg-surface-2 text-ink-1'
                  : 'border-line text-ink-2 hover:border-line-strong hover:text-ink-1',
                dim && 'opacity-50',
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: def.color }} />
              {def.label}
            </button>
          );
        })}
        {compare && (
          <span className="ml-1 flex items-center gap-1.5 text-[11px] text-ink-3">
            <span className="inline-block h-0 w-4 border-t-2 border-dashed border-ink-3" /> previous period
          </span>
        )}
      </div>

      {/* chart + brush */}
      <div className="h-[340px] w-full px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(t: number) => formatDate(t, stepMs >= 86_400_000 ? 'MMM d' : 'MMM d HH:mm')}
              tick={{ fill: 'var(--text-3)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              minTickGap={48}
            />
            {metrics.map((id) => (
              <YAxis
                key={id}
                yAxisId={id}
                hide={id !== focus}
                width={46}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => formatMetric(focusDef.unit, v)}
                tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
            ))}
            <Tooltip
              content={<ComparisonTooltip metrics={metrics} compare={compare} stepMs={stepMs} />}
              cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
            />
            {metrics.map((id) => {
              const def = metricDef(id);
              const opacity = isolated && isolated !== id ? 0.15 : 1;
              return [
                compare ? (
                  <Line
                    key={`prev_${id}`}
                    yAxisId={id}
                    dataKey={`prev_${id}`}
                    stroke={def.color}
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    strokeOpacity={0.3 * opacity}
                    dot={false}
                    isAnimationActive={false}
                  />
                ) : null,
                <Line
                  key={id}
                  yAxisId={id}
                  dataKey={id}
                  stroke={def.color}
                  strokeWidth={2}
                  strokeOpacity={opacity}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                />,
              ];
            })}
            <Brush
              key={brushKey}
              dataKey="t"
              height={40}
              startIndex={zoom[0]}
              endIndex={zoom[1]}
              onChange={(w: any) => {
                if (typeof w?.startIndex === 'number' && typeof w?.endIndex === 'number') {
                  setZoom([w.startIndex, w.endIndex]);
                }
              }}
              tickFormatter={(t: number) => formatDate(t, 'MMM d')}
              stroke="var(--border-strong)"
              fill="var(--surface-2)"
              travellerWidth={8}
            >
              <LineChart data={data}>
                <Line dataKey={focus} stroke={focusDef.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </Brush>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
