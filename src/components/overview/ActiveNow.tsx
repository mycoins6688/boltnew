import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/useCountUp';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';

/** Blinker positions over the dot map (percent coords). */
const BLINKERS: Array<[number, number, number]> = [
  [22, 34, 0], [30, 62, 0.4], [47, 24, 0.9], [52, 48, 0.2],
  [60, 30, 1.1], [68, 40, 0.6], [78, 56, 1.4], [85, 72, 0.8],
];

export default function ActiveNow() {
  const { presence, minuteBars, live } = useLiveMetrics();
  const display = useCountUp(presence, 400);
  const max = Math.max(...minuteBars, 1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.56, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card relative col-span-12 overflow-hidden md:col-span-6 xl:col-span-4"
      aria-label="Active users right now"
    >
      {/* dotted world map backdrop */}
      <img
        src="/dot-map.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]"
      />
      {/* blinking presence dots */}
      {BLINKERS.map(([x, y, delay], i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-brand"
          style={{ left: `${x}%`, top: `${y}%` }}
          animate={live ? { opacity: [0.2, 1, 0.2] } : { opacity: 0.35 }}
          transition={live ? { duration: 1.2 + ((i * 0.37) % 1.2), repeat: Infinity, delay } : { duration: 0.2 }}
        />
      ))}

      <div className="relative p-5">
        <div className="v-label">Active right now</div>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="tnum text-[36px] font-bold leading-10 tracking-[-0.03em] text-ink-1">
            {Math.round(display)}
          </span>
          {live && <span className="v-live-dot" />}
        </div>
        <p className="mt-0.5 text-[12px] text-ink-3">active users right now</p>

        {/* mini bar chart — last 12 minutes */}
        <div className="mt-5 flex h-14 items-end gap-1.5">
          {minuteBars.map((v, i) => (
            <motion.div
              key={`${i}-${v}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(8, (v / max) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 rounded-sm"
              style={{
                background: i === minuteBars.length - 1 ? 'var(--accent)' : 'color-mix(in srgb, var(--text-3) 40%, transparent)',
              }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-3">
          <span>12m ago</span>
          <span>now</span>
        </div>
      </div>
    </motion.section>
  );
}
