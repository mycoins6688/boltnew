import { motion } from 'framer-motion';
import { CHART_COLORS, mulberry32, seededSeries } from '@/lib/live';
import type { PreviewKind } from './data';

/**
 * Miniature live previews for report template cards — tiny code-drawn SVG
 * charts (design/reports.md §2). Muted accent tones; animate on hover via
 * the `active` prop (line re-draws / bars grow, 600ms).
 */

const W = 220;
const H = 96;

function AreaPreview({ active }: { active: boolean }) {
  const data = seededSeries(101, 24, 50, 9, 1.2);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (W - 8) + 4;
    const y = 10 + (1 - (v - min) / span) * (H - 22);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - 4} L${pts[0][0].toFixed(1)},${H - 4} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill={CHART_COLORS[0]} opacity={0.14} />
      <motion.path
        d={line}
        fill="none"
        stroke={CHART_COLORS[0]}
        strokeOpacity={0.75}
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={false}
        animate={{ pathLength: active ? [0, 1] : 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </svg>
  );
}

function BarsPreview({ active }: { active: boolean }) {
  const rnd = mulberry32(202);
  const stacks = Array.from({ length: 9 }, () => {
    const a = 12 + rnd() * 26;
    const b = 6 + rnd() * 16;
    const c = 4 + rnd() * 8;
    return [a, b, c] as const;
  });
  const bw = 12;
  const gap = (W - 16 - bw * stacks.length) / (stacks.length - 1);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {stacks.map((s, i) => {
        const total = s[0] + s[1] + s[2];
        const scale = (H - 16) / 70;
        const x = 8 + i * (bw + gap);
        const hs = [s[0] * scale, s[1] * scale, s[2] * scale];
        const baseY = H - 6;
        return (
          <motion.g
            key={i}
            initial={false}
            animate={{ scaleY: active ? [0.4, 1] : 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.03 }}
            style={{ transformOrigin: `${x}px ${baseY}px` }}
          >
            <rect x={x} y={baseY - total * scale} width={bw} height={hs[0]} rx={1.5} fill={CHART_COLORS[0]} opacity={0.75} />
            <rect x={x} y={baseY - (s[1] + s[2]) * scale} width={bw} height={hs[1]} rx={1.5} fill={CHART_COLORS[2]} opacity={0.65} />
            <rect x={x} y={baseY - s[2] * scale} width={bw} height={hs[2]} rx={1.5} fill={CHART_COLORS[5]} opacity={0.55} />
          </motion.g>
        );
      })}
    </svg>
  );
}

function FunnelPreview({ active }: { active: boolean }) {
  const stages = [100, 68, 42, 24];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {stages.map((pct, i) => {
        const w = (pct / 100) * (W - 48);
        const y = 10 + i * 21;
        return (
          <g key={i}>
            <motion.rect
              x={(W - w) / 2}
              y={y}
              width={w}
              height={14}
              rx={3}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              opacity={0.7 - i * 0.08}
              initial={false}
              animate={{ scaleX: active ? [0.3, 1] : 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.06 }}
              style={{ transformOrigin: `${W / 2}px ${y}px` }}
            />
            <text x={W - 26} y={y + 10.5} fontSize={9} fill="var(--text-3)" fontFamily="JetBrains Mono, monospace">
              {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HeatmapPreview({ active }: { active: boolean }) {
  const rnd = mulberry32(303);
  const cols = 12;
  const rows = 4;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const v = 0.15 + rnd() * 0.75 * (1 - c / cols);
        const cw = (W - 20) / cols;
        return (
          <motion.rect
            key={i}
            x={10 + c * cw + 1.5}
            y={12 + r * ((H - 24) / rows) + 1.5}
            width={cw - 3}
            height={(H - 24) / rows - 3}
            rx={2}
            fill={CHART_COLORS[0]}
            initial={false}
            animate={{ opacity: active ? [0.1, v] : v }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: c * 0.03 }}
          />
        );
      })}
    </svg>
  );
}

function GaugePreview({ active }: { active: boolean }) {
  const cx = W / 2;
  const cy = H - 14;
  const r = 34;
  const pct = 0.72;
  const arc = (frac: number) => {
    const a = Math.PI * (1 - frac);
    return `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="var(--surface-3)" strokeWidth={7} strokeLinecap="round" />
      <motion.path
        d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${arc(pct)}`}
        fill="none"
        stroke={CHART_COLORS[1]}
        strokeWidth={7}
        strokeLinecap="round"
        initial={false}
        animate={{ pathLength: active ? [0, 1] : 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text-2)" fontFamily="JetBrains Mono, monospace">
        72%
      </text>
    </svg>
  );
}

function KpisPreview({ active }: { active: boolean }) {
  const tiles = [
    { label: 'MRR', value: '$128K', seed: 401 },
    { label: 'GROWTH', value: '+8.2%', seed: 402 },
    { label: 'CHURN', value: '1.9%', seed: 403 },
    { label: 'NRR', value: '118%', seed: 404 },
  ];
  return (
    <div className="grid h-full grid-cols-2 gap-2 p-3" aria-hidden="true">
      {tiles.map((t, i) => {
        const data = seededSeries(t.seed, 10, 30, 6, 0.5);
        const min = Math.min(...data);
        const span = Math.max(...data) - min || 1;
        const pts = data
          .map((v, j) => `${(j / (data.length - 1)) * 56 + 2},${12 + (1 - (v - min) / span) * 10}`)
          .join(' ');
        return (
          <motion.div
            key={t.label}
            className="rounded-sm border border-line bg-surface px-2 py-1.5"
            initial={false}
            animate={{ scale: active ? [0.94, 1] : 1, opacity: active ? [0.5, 1] : 1 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <p className="text-[7px] font-medium uppercase tracking-[0.06em] text-ink-3">{t.label}</p>
            <div className="flex items-end justify-between gap-1">
              <span className="font-mono text-[11px] font-semibold text-ink-1">{t.value}</span>
              <svg width={60} height={24} viewBox="0 0 60 24">
                <polyline points={pts} fill="none" stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={1.4} strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function MiniPreview({ kind, active }: { kind: PreviewKind; active: boolean }) {
  switch (kind) {
    case 'area':
      return <AreaPreview active={active} />;
    case 'bars':
      return <BarsPreview active={active} />;
    case 'funnel':
      return <FunnelPreview active={active} />;
    case 'heatmap':
      return <HeatmapPreview active={active} />;
    case 'gauge':
      return <GaugePreview active={active} />;
    case 'kpis':
    default:
      return <KpisPreview active={active} />;
  }
}
