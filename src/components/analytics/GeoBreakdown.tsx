import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SegmentedControl from '@/components/SegmentedControl';
import { fmtCompact } from '@/lib/live';
import { cn } from '@/lib/utils';
import type { GeoMode } from './data';
import { GEO_MODES, GEO_ROWS, GEO_TOTAL_USERS, geoModeKey } from './data';

/**
 * Geography breakdown (analytics.md §6) — ranked country list with animated
 * share bars. Switching the mode re-sorts the list with a FLIP layout
 * animation (Framer Motion `layout`).
 */
export default function GeoBreakdown({ index = 0 }: { index?: number }) {
  const [mode, setMode] = useState<GeoMode>('By users');
  const key = geoModeKey(mode);

  const rows = useMemo(() => [...GEO_ROWS].sort((a, b) => b.share[key] - a.share[key]), [key]);
  const maxShare = rows[0]?.share[key] ?? 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card col-span-12 flex flex-col lg:col-span-5"
      aria-label="Geography breakdown"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Geography</h2>
          <p className="text-[12px] text-ink-3">Where your users come from</p>
        </div>
        <SegmentedControl options={GEO_MODES} value={mode} onChange={setMode} id="geo-mode" />
      </div>

      <div className="flex-1 px-5 py-3">
        {rows.map((row, i) => {
          const share = row.share[key];
          const delta = row.delta[key];
          const users = Math.round((row.share.users / 100) * GEO_TOTAL_USERS);
          const positive = delta >= 0;
          return (
            <motion.div
              key={row.code}
              layout
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              whileHover={{ x: 2 }}
              className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
            >
              <span className="grid w-7 shrink-0 place-items-center rounded-sm bg-surface-2 py-0.5 font-mono text-[10px] font-semibold text-ink-2">
                {row.code}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-ink-1">{row.name}</span>
                  <span className="tnum font-mono text-[11px] text-ink-3">{fmtCompact(users)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-3">
                    <motion.div
                      className="h-full rounded-pill"
                      style={{ background: 'var(--accent)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(share / maxShare) * 100}%` }}
                      transition={{ delay: 0.35 + i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="tnum w-10 text-right font-mono text-[11px] text-ink-2">{share.toFixed(1)}%</span>
                  <span
                    className={cn(
                      'tnum w-12 rounded-pill px-1.5 py-0.5 text-right font-mono text-[10px] font-medium',
                      positive ? 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success' : 'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger',
                    )}
                  >
                    {positive ? '+' : ''}
                    {delta.toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="border-t border-line px-5 py-3 text-[11px] text-ink-3">
        {fmtCompact(GEO_TOTAL_USERS)} total users · {rows.length} countries tracked
      </div>
    </motion.section>
  );
}
