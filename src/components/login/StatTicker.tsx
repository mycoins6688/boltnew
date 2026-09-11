import { memo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPref } from '@/hooks/useLiveMetrics';

const ITEMS = [
  'MRR $128.4K ▲12.4%',
  '24,847 active users',
  '312 events/sec',
  '99.99% uptime',
  '1,204 signups today',
  '3.42% conversion',
] as const;

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((it) => (
        <span key={it} className="flex items-center">
          <span className="tnum whitespace-nowrap font-mono text-[12px] text-ink-2">{it}</span>
          <span className="mx-6 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

/** Horizontally scrolling mono stat strip — 20s linear loop (login.md §2). */
export default memo(function StatTicker({ className }: { className?: string }) {
  const reduced = useReducedMotionPref();
  return (
    <div
      className={
        'overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)] ' +
        (className ?? '')
      }
    >
      {reduced ? (
        <div className="flex w-max">
          <Row />
        </div>
      ) : (
        <motion.div
          className="flex w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
        >
          <Row />
          <Row />
        </motion.div>
      )}
    </div>
  );
});
