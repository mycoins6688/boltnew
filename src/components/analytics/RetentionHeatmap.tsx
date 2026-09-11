import { useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPref } from '@/hooks/useLiveMetrics';
import { cn } from '@/lib/utils';
import { RETENTION_COHORTS, RETENTION_WEEKS, retentionMatrix } from './data';

/**
 * Retention heatmap (analytics.md §4) — 8 weekly cohorts × W0–W7.
 * Cells cascade in on a diagonal wave; column hover highlights the whole
 * column; cell hover shows a cursor-following tooltip. Fills use the accent
 * CSS variable so theme toggles crossfade them.
 */

interface Tip {
  x: number;
  y: number;
  text: string;
}

export default function RetentionHeatmap({ index = 0 }: { index?: number }) {
  const reduced = useReducedMotionPref();
  const matrix = useMemo(retentionMatrix, []);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const onCellMove = (e: MouseEvent, text: string) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card col-span-12 flex flex-col lg:col-span-7"
      aria-label="Weekly retention heatmap"
    >
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Weekly retention</h2>
        <p className="text-[12px] text-ink-3">Share of each cohort still active N weeks later</p>
      </div>

      <div ref={wrapRef} className="relative flex-1 px-5 py-4" onMouseLeave={() => { setHoverCol(null); setTip(null); }}>
        {/* week header */}
        <div className="grid grid-cols-[56px_repeat(8,minmax(0,1fr))] gap-1.5 pb-1.5">
          <span />
          {RETENTION_WEEKS.map((w, c) => (
            <span
              key={w}
              className={cn(
                'text-center font-mono text-[10px] transition-colors duration-150',
                hoverCol === c ? 'text-ink-1' : 'text-ink-3',
              )}
            >
              {w}
            </span>
          ))}
        </div>

        {matrix.map((row, r) => (
          <div key={RETENTION_COHORTS[r]} className="grid grid-cols-[56px_repeat(8,minmax(0,1fr))] items-center gap-1.5 pb-1.5">
            <span className="pr-1 text-right font-mono text-[10px] text-ink-3">{RETENTION_COHORTS[r]}</span>
            {row.map((v, c) =>
              v === null ? (
                <div key={c} className="aspect-square rounded-sm border border-dashed border-line" aria-hidden="true" />
              ) : (
                <motion.button
                  key={c}
                  type="button"
                  aria-label={`Week ${c} · ${v}% of ${RETENTION_COHORTS[r]} cohort retained`}
                  initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: reduced ? 0 : (r + c) * 0.04, duration: 0.3, ease: 'easeOut' }}
                  onMouseEnter={(e) => {
                    setHoverCol(c);
                    onCellMove(e, `Week ${c} · ${v}% of ${RETENTION_COHORTS[r]} cohort retained`);
                  }}
                  onMouseMove={(e) => onCellMove(e, `Week ${c} · ${v}% of ${RETENTION_COHORTS[r]} cohort retained`)}
                  onMouseLeave={() => setTip(null)}
                  onFocus={() => setHoverCol(c)}
                  onBlur={() => { setHoverCol(null); setTip(null); }}
                  className={cn(
                    'grid aspect-square place-items-center rounded-sm transition-[box-shadow] duration-150',
                    hoverCol === c && 'ring-1 ring-line-strong',
                  )}
                  style={{ background: `color-mix(in srgb, var(--accent) ${Math.max(8, v)}%, transparent)` }}
                >
                  {v >= 40 && (
                    <span
                      className="tnum font-mono text-[10px] font-medium"
                      style={{ color: v >= 62 ? '#FFFFFF' : 'var(--text-1)' }}
                    >
                      {v}
                    </span>
                  )}
                </motion.button>
              ),
            )}
          </div>
        ))}

        {/* cursor tooltip */}
        {tip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] text-ink-1 shadow-pop"
            style={{ left: tip.x, top: tip.y - 36 }}
          >
            {tip.text}
          </div>
        )}
      </div>

      {/* scale legend */}
      <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
        <span className="font-mono text-[10px] text-ink-3">0%</span>
        <span
          className="h-2 w-24 rounded-pill"
          style={{ background: 'linear-gradient(90deg, transparent, var(--accent))' }}
          aria-hidden="true"
        />
        <span className="font-mono text-[10px] text-ink-3">100%</span>
      </div>
    </motion.section>
  );
}
