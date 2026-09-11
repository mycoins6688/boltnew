import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { CHART_COLORS } from '@/lib/live';
import { cn } from '@/lib/utils';

const SEGMENTS = [
  { label: 'Organic search', share: 38, delta: +2.1 },
  { label: 'Direct', share: 24, delta: +0.8 },
  { label: 'Referral', share: 16, delta: -1.2 },
  { label: 'Social', share: 12, delta: +3.4 },
  { label: 'Email', share: 10, delta: -0.4 },
];

const R = 64;
const C = 2 * Math.PI * R;

export default function TrafficDonut() {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = useCountUp(84.2);

  let acc = 0;
  const arcs = SEGMENTS.map((s, i) => {
    const len = (s.share / 100) * C;
    const offset = acc;
    acc += len;
    return { ...s, i, len, offset, color: CHART_COLORS[i] };
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.48, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card col-span-12 md:col-span-6 xl:col-span-4"
      aria-label="Traffic sources"
    >
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Traffic sources</h2>
        <p className="text-[12px] text-ink-3">Last 30 days · by visit share</p>
      </div>

      <div className="flex flex-col items-center gap-5 p-5">
        <div className="relative h-[168px] w-[168px]">
          <svg viewBox="0 0 168 168" className="h-full w-full -rotate-90">
            {arcs.map((a) => (
              <motion.circle
                key={a.label}
                cx="84"
                cy="84"
                r={R}
                fill="none"
                stroke={a.color}
                strokeLinecap="butt"
                strokeDasharray={`${a.len} ${C - a.len}`}
                strokeDashoffset={-a.offset}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: hovered === null || hovered === a.i ? 1 : 0.4,
                  strokeWidth: hovered === a.i ? 26 : 20,
                }}
                transition={{ duration: 0.2 }}
                style={{ transition: 'stroke-width 200ms ease' }}
              />
            ))}
            {/* sweep-in overlay animation */}
            <motion.circle
              cx="84"
              cy="84"
              r={R}
              fill="none"
              stroke="var(--surface)"
              strokeWidth={30}
              initial={{ strokeDasharray: `${C} ${C}`, strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -C }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              pointerEvents="none"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tnum text-[20px] font-semibold leading-6 text-ink-1">{total.toFixed(1)}K</span>
            <span className="text-[11px] text-ink-3">visits</span>
          </div>
        </div>

        <ul className="w-full">
          {arcs.map((a) => {
            const up = a.delta >= 0;
            return (
              <li
                key={a.label}
                onMouseEnter={() => setHovered(a.i)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150',
                  hovered === a.i && 'bg-surface-2',
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                <span className="flex-1 text-ink-2">{a.label}</span>
                <span className="tnum font-mono text-[12px] font-medium text-ink-1">{a.share}%</span>
                <span className={cn('flex w-14 items-center justify-end gap-0.5 font-mono text-[11px]', up ? 'text-success' : 'text-danger')}>
                  {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(a.delta).toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
