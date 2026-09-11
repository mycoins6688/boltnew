import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpCircle,
  FileText,
  KeyRound,
  PauseCircle,
  Sparkles,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { avatarGradient, fmtClock, fmtNumber, initials } from '@/lib/live';
import type { LiveEventType } from '@/lib/live';
import { cn } from '@/lib/utils';

const EVENT_ICON: Record<LiveEventType, { icon: typeof ArrowUpCircle; color: string }> = {
  upgrade: { icon: ArrowUpCircle, color: 'var(--success)' },
  report: { icon: FileText, color: 'var(--info)' },
  invite: { icon: UserPlus, color: 'var(--accent)' },
  apikey: { icon: KeyRound, color: 'var(--warning)' },
  limit: { icon: TriangleAlert, color: 'var(--danger)' },
  trial: { icon: Sparkles, color: 'var(--success)' },
};

export default function LiveFeed() {
  const { events, presence, live } = useLiveMetrics();
  const now = Date.now();

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card relative col-span-12 flex flex-col overflow-hidden xl:col-span-4"
      aria-label="Live activity feed"
    >
      <div className="flex items-center gap-2 border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Live activity</h2>
        {live && <span className="v-live-dot" />}
        <span className="ml-auto rounded-pill bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium text-ink-2">
          {fmtNumber(presence)} online
        </span>
      </div>

      <ul
        className="max-h-[386px] flex-1 overflow-y-auto [mask-image:linear-gradient(180deg,black_88%,transparent)]"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {events.map((e) => {
            const meta = EVENT_ICON[e.type];
            const Icon = meta.icon;
            const stale = now - e.at > 10_000;
            return (
              <motion.li
                key={e.id}
                layout="position"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    'flex items-center gap-3 border-b border-line px-5 py-2.5 transition-colors duration-500 last:border-0',
                    stale && 'opacity-50',
                  )}
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                    style={{ background: avatarGradient(e.name) }}
                  >
                    {initials(e.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] leading-5 text-ink-1">
                      <span className="font-semibold">{e.name}</span>{' '}
                      <span className="text-ink-2">{e.verb}</span>
                      {e.object ? (
                        <>
                          {' '}
                          <span className="font-semibold">{e.object || e.company}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="font-mono text-[10px] text-ink-3">
                      {fmtClock(new Date(e.at))} · {e.company}
                    </p>
                  </div>
                  <Icon size={16} className="shrink-0" style={{ color: meta.color }} />
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* paused overlay */}
      <AnimatePresence>
        {!live && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 bottom-4 z-10 flex justify-center"
          >
            <span className="flex items-center gap-1.5 rounded-pill bg-surface-3 px-3 py-1 text-[11px] font-semibold text-ink-2 shadow-card">
              <PauseCircle size={13} /> Paused
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
