import { motion } from 'framer-motion';
import Sparkline from '@/components/Sparkline';
import { useCountUp } from '@/hooks/useCountUp';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { seededSeries } from '@/lib/live';

/**
 * Summary strip — 4 mini stats with 7-day sparklines, count-up values
 * (design/customers.md §2). Churn risk drifts ±1 on live ticks and flashes
 * warning-soft.
 */
function Stat({
  label,
  value,
  spark,
  tone,
  index,
  flashKey,
}: {
  label: string;
  value: string;
  spark: number[];
  tone: string;
  index: number;
  flashKey?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center justify-between gap-3 px-5 py-4"
    >
      {flashKey !== undefined && flashKey > 0 && (
        <motion.span
          key={flashKey}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute inset-0 bg-[rgba(217,119,6,0.10)]"
        />
      )}
      <div>
        <p className="v-label">{label}</p>
        <p className="mt-1 text-[20px] font-semibold leading-6 tracking-[-0.01em] text-ink-1 tnum">{value}</p>
      </div>
      <Sparkline data={spark} color={tone} width={72} height={26} />
    </motion.div>
  );
}

export default function SummaryStrip() {
  const { tick, live } = useLiveMetrics();
  // churn risk drifts ±1 every few live ticks (derived from the shared tick)
  const churnRisk = 47 + Math.round(6 * Math.sin(tick / 7));
  const churnFlash = live && tick > 0 && tick % 3 === 0 ? tick : 0;

  const mrr = useCountUp(482900);
  const newMonth = useCountUp(64);
  const avgHealth = useCountUp(78);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x"
      aria-label="Customer summary"
    >
      <Stat label="Total MRR" value={`$${Math.round(mrr).toLocaleString('en-US')}`} spark={seededSeries(501, 14, 400, 22, 4)} tone="var(--accent)" index={0} />
      <Stat label="New this month" value={`+${Math.round(newMonth)}`} spark={seededSeries(502, 14, 40, 8, 1.4)} tone="var(--success)" index={1} />
      <Stat label="Avg. health score" value={`${Math.round(avgHealth)}/100`} spark={seededSeries(503, 14, 74, 5, 0.2)} tone="var(--info)" index={2} />
      <Stat label="Churn risk" value={`${churnRisk} accounts`} spark={seededSeries(504, 14, 52, 6, -0.4)} tone="var(--warning)" index={3} flashKey={churnFlash} />
    </motion.section>
  );
}
