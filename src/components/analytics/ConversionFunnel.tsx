import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Sparkline from '@/components/Sparkline';
import { useCountUp } from '@/hooks/useCountUp';
import { useLiveMetrics, useReducedMotionPref } from '@/hooks/useLiveMetrics';
import { fmtNumber } from '@/lib/live';
import { cn } from '@/lib/utils';
import type { Segment } from './data';
import { FUNNEL_DROPOFFS, FUNNEL_STAGES, segmentScale } from './data';

/**
 * Conversion funnel (analytics.md §3) — 4 trapezoid SVG stages with a
 * left→right wipe on mount, drop-off connectors, hover detail card, and a
 * live-drifting "Signed up" count from the shared engine.
 */

const WIDTHS = [100, 64, 42, 28]; // percent, visual narrowing
const VB_W = 420;
const BAR_H = 46;
const GAP = 20;

/** Count-up number for SVG text labels (800ms on mount, 400ms on live drift). */
function CountText({ value }: { value: number }) {
  const v = useCountUp(value, 800);
  return <>{fmtNumber(Math.round(v))}</>;
}

function stageValue(i: number, segment: Segment, liveSignupsDelta: number): number {
  const base = FUNNEL_STAGES[i].value * segmentScale(segment);
  const v = i === 1 ? base + liveSignupsDelta : base;
  return Math.max(0, Math.round(v));
}

export default function ConversionFunnel({ segment, index = 0 }: { segment: Segment; index?: number }) {
  const { signupsToday } = useLiveMetrics();
  const reduced = useReducedMotionPref();
  const [hovered, setHovered] = useState<number | null>(null);
  const liveDelta = signupsToday - 1204;

  const stages = useMemo(
    () => FUNNEL_STAGES.map((s, i) => ({ ...s, liveValue: stageValue(i, segment, liveDelta) })),
    [segment, liveDelta],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card relative col-span-12 flex flex-col lg:col-span-5"
      aria-label="Conversion funnel"
    >
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Conversion funnel</h2>
        <p className="text-[12px] text-ink-3">Visit → upgrade · {segment.toLowerCase()}</p>
      </div>

      <div className="relative flex-1 px-5 py-4">
        <svg
          viewBox={`0 0 ${VB_W} ${4 * BAR_H + 3 * GAP + 8}`}
          className="w-full"
          role="img"
          aria-label="Funnel: 84,210 visited, 21,846 signed up, 9,422 activated, 3,118 upgraded"
        >
          {stages.map((stage, i) => {
            const topW = (WIDTHS[i] / 100) * VB_W;
            const bottomW = ((WIDTHS[i + 1] ?? WIDTHS[i] * 0.7) / 100) * VB_W;
            const y = i * (BAR_H + GAP);
            const dim = hovered !== null && hovered !== i;
            return (
              <g key={stage.name}>
                <motion.polygon
                  points={`0,${y} ${topW},${y} ${bottomW},${y + BAR_H} 0,${y + BAR_H}`}
                  fill={stage.color}
                  fillOpacity={dim ? 0.35 : hovered === i ? 1 : 0.88}
                  initial={reduced ? false : { scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{
                    delay: reduced ? 0 : 0.15 + i * 0.12,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'left center', cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
                {/* value + label */}
                <motion.g
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduced ? 0 : 0.35 + i * 0.12, duration: 0.4 }}
                  pointerEvents="none"
                >
                  <text x={12} y={y + 19} fontSize={12} fontWeight={600} fill="#FFFFFF" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {stage.name}
                  </text>
                  <text x={12} y={y + 36} fontSize={12} fontWeight={500} fill="#FFFFFF" fillOpacity={0.85} className="tnum" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <CountText value={stage.liveValue} /> · {stage.pct}%
                  </text>
                  {i === 1 && (
                    <circle cx={topW - 16} cy={y + 14} r={3.5} fill="#FFFFFF">
                      <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </motion.g>
                {/* drop-off connector */}
                {i < 3 && (
                  <motion.text
                    x={6}
                    y={y + BAR_H + GAP / 2 + 4}
                    fontSize={11}
                    fill="var(--text-3)"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduced ? 0 : 0.85 + i * 0.1, duration: 0.4 }}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {FUNNEL_DROPOFFS[i]}
                  </motion.text>
                )}
              </g>
            );
          })}
        </svg>

        {/* hover detail card */}
        <AnimatePresence>
          {hovered !== null && (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute right-4 top-4 w-44 rounded-md border border-line bg-surface p-3 shadow-pop"
            >
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-1">
                <span className="h-2 w-2 rounded-full" style={{ background: stages[hovered].color }} />
                {stages[hovered].name}
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-ink-3">
                <div className="flex justify-between">
                  <span>Conversion</span>
                  <span className="tnum font-mono font-medium text-ink-1">{stages[hovered].pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Median time-to-next</span>
                  <span className="tnum font-mono font-medium text-ink-1">{stages[hovered].timeToNext}</span>
                </div>
              </div>
              <div className="mt-2">
                <Sparkline data={stages[hovered].spark} color={stages[hovered].color} width={160} height={28} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={() => toast('Funnel builder coming to your workspace')}
          className={cn(
            'flex items-center gap-1 text-[12px] font-medium text-brand transition-colors duration-150',
            'hover:text-brand-strong',
          )}
        >
          Open funnel builder <ArrowRight size={13} />
        </button>
      </div>
    </motion.section>
  );
}
