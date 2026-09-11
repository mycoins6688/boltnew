import { motion } from 'framer-motion';
import { healthTone } from './data';
import { cn } from '@/lib/utils';

/**
 * Health score bar — 48px track (surface-3), fill colored by score
 * (success ≥70 / warning 40–69 / danger <40). Width tweens 400ms on
 * live ticks (design/customers.md §3).
 */
export default function HealthBar({ score }: { score: number }) {
  const tone = healthTone(score);
  const color = tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 overflow-hidden rounded-pill bg-surface-3" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Health score ${score}`}>
        <motion.div
          className="h-full rounded-pill"
          initial={false}
          animate={{ width: `${Math.max(2, score)}%`, backgroundColor: color }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span
        className={cn(
          'font-mono text-[12px] font-medium tnum',
          tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-danger',
        )}
      >
        {score}
      </span>
    </div>
  );
}
