import { useState } from 'react';
import type { ReactElement } from 'react';
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion';
import { AlignLeft, BarChart3, Check, Filter, GripVertical, LayoutGrid, Table2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Sparkline from '@/components/Sparkline';
import SegmentedControl from '@/components/SegmentedControl';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { CHART_COLORS, avatarGradient, initials } from '@/lib/live';
import { cn } from '@/lib/utils';
import { ALL_BLOCKS, BLOCK_META } from './data';
import type { BlockType, Cadence } from './data';

/**
 * Report builder drawer — right-side 520px panel with scrim
 * (design/reports.md §5). Checkable block modules, schedule row with
 * recipient token chips, drag-to-reorder live preview (Framer Reorder).
 */

const BLOCK_ICON: Record<BlockType, LucideIcon> = {
  kpi: LayoutGrid,
  revenue: BarChart3,
  funnel: Filter,
  toppages: Table2,
  cohort: LayoutGrid,
  notes: AlignLeft,
};

const CADENCES = ['Daily', 'Weekly Mon', 'Monthly 1st'] as const;

/* --------------------------- preview block art --------------------------- */

function KpiPreviewArt() {
  const tiles = [
    { l: 'MRR', v: '$128.4K' },
    { l: 'GROWTH', v: '+8.2%' },
    { l: 'CHURN', v: '1.9%' },
    { l: 'NRR', v: '118%' },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {tiles.map((t) => (
        <div key={t.l} className="rounded-sm border border-line bg-surface-2 px-1.5 py-1">
          <p className="text-[7px] font-medium uppercase tracking-wide text-ink-3">{t.l}</p>
          <p className="font-mono text-[10px] font-semibold text-ink-1">{t.v}</p>
        </div>
      ))}
    </div>
  );
}

function RevenuePreviewArt() {
  const { revenueSeries } = useLiveMetrics();
  return (
    <div className="rounded-sm border border-line bg-surface-2 p-1.5">
      <Sparkline data={revenueSeries.slice(-30)} width={252} height={44} color={CHART_COLORS[0]} />
    </div>
  );
}

function FunnelPreviewArt() {
  const stages = [
    { l: 'Visited', v: 100 },
    { l: 'Signed up', v: 68 },
    { l: 'Activated', v: 42 },
    { l: 'Paid', v: 24 },
  ];
  return (
    <div className="space-y-1 rounded-sm border border-line bg-surface-2 p-1.5">
      {stages.map((s, i) => (
        <div key={s.l} className="flex items-center gap-1.5">
          <span className="w-12 truncate text-[8px] text-ink-3">{s.l}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-3">
            <div className="h-full rounded-sm" style={{ width: `${s.v}%`, background: CHART_COLORS[i % CHART_COLORS.length], opacity: 0.8 }} />
          </div>
          <span className="w-6 text-right font-mono text-[8px] text-ink-3">{s.v}%</span>
        </div>
      ))}
    </div>
  );
}

function TopPagesPreviewArt() {
  const pages = [
    ['/pricing', '48.2K'],
    ['/features', '31.9K'],
    ['/docs/quickstart', '22.4K'],
    ['/blog/churn-guide', '18.1K'],
    ['/integrations', '12.7K'],
  ];
  return (
    <div className="rounded-sm border border-line bg-surface-2 p-1.5">
      {pages.map(([p, v]) => (
        <div key={p} className="flex items-center justify-between py-0.5 text-[9px]">
          <span className="font-mono text-ink-2">{p}</span>
          <span className="font-mono text-ink-3">{v}</span>
        </div>
      ))}
    </div>
  );
}

function CohortPreviewArt() {
  const rows = [0.95, 0.82, 0.68, 0.5, 0.36];
  return (
    <div className="flex gap-1 rounded-sm border border-line bg-surface-2 p-1.5">
      {rows.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{ height: 26, background: CHART_COLORS[0], opacity: 0.15 + v * 0.7 }} />
      ))}
    </div>
  );
}

function NotesPreviewArt() {
  return (
    <div className="space-y-1 rounded-sm border border-line bg-surface-2 p-2">
      <div className="h-1.5 w-11/12 rounded-pill bg-surface-3" />
      <div className="h-1.5 w-full rounded-pill bg-surface-3" />
      <div className="h-1.5 w-3/5 rounded-pill bg-surface-3" />
    </div>
  );
}

const PREVIEW_ART: Record<BlockType, () => ReactElement> = {
  kpi: KpiPreviewArt,
  revenue: RevenuePreviewArt,
  funnel: FunnelPreviewArt,
  toppages: TopPagesPreviewArt,
  cohort: CohortPreviewArt,
  notes: NotesPreviewArt,
};

function PreviewItem({ block }: { block: BlockType }) {
  const controls = useDragControls();
  const Art = PREVIEW_ART[block];
  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.02, boxShadow: 'var(--shadow-pop)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="v-card relative flex items-start gap-2 p-2"
    >
      <button
        type="button"
        aria-label={`Reorder ${BLOCK_META[block].label}`}
        onPointerDown={(e) => controls.start(e)}
        className="mt-0.5 cursor-grab touch-none rounded-sm p-1 text-ink-3 hover:bg-surface-2 hover:text-ink-2 active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.04em] text-ink-3">{BLOCK_META[block].label}</p>
        <Art />
      </div>
    </Reorder.Item>
  );
}

/* -------------------------------- drawer -------------------------------- */

export interface BuilderConfig {
  name: string;
  blocks: BlockType[];
}

export default function ReportBuilder({
  open,
  initial,
  onClose,
  onCreate,
}: {
  open: boolean;
  initial: BuilderConfig | null;
  onClose: () => void;
  onCreate: (cfg: BuilderConfig & { cadence: Cadence; recipients: string[] }) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close report builder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />
          <BuilderPanel initial={initial} onClose={onClose} onCreate={onCreate} />
        </>
      )}
    </AnimatePresence>
  );
}

/** Inner panel — mounts fresh on each open, so state needs no reset effect. */
function BuilderPanel({
  initial,
  onClose,
  onCreate,
}: {
  initial: BuilderConfig | null;
  onClose: () => void;
  onCreate: (cfg: BuilderConfig & { cadence: Cadence; recipients: string[] }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? 'Untitled report');
  const [blocks, setBlocks] = useState<BlockType[]>(initial?.blocks ?? ['kpi', 'revenue', 'notes']);
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]>('Weekly Mon');
  const [recipients, setRecipients] = useState<string[]>(['Ava Reyes']);
  const [recipientInput, setRecipientInput] = useState('');

  const toggleBlock = (b: BlockType) =>
    setBlocks((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const addRecipient = () => {
    const v = recipientInput.trim().replace(/,$/, '');
    if (!v) return;
    if (!recipients.includes(v)) setRecipients((r) => [...r, v]);
    setRecipientInput('');
  };

  return (
    <motion.aside
      role="dialog"
      aria-label="Report builder"
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-[520px] max-w-full flex-col border-l border-line bg-surface shadow-pop"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">New report</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* name */}
              <label className="v-label" htmlFor="report-name">Report name</label>
              <input
                id="report-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink-1 outline-none transition-colors duration-150 focus:border-brand"
              />

              {/* blocks */}
              <p className="v-label mt-5">Blocks</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {ALL_BLOCKS.map((b) => {
                  const active = blocks.includes(b);
                  const Icon = BLOCK_ICON[b];
                  return (
                    <motion.button
                      key={b}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleBlock(b)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-start gap-2 rounded-md border p-2.5 text-left transition-colors duration-150',
                        active ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-surface-2',
                      )}
                    >
                      <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-sm border', active ? 'border-brand bg-brand text-white' : 'border-line-strong')}>
                        {active && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-1">
                          <Icon size={13} className="text-ink-3" />
                          {BLOCK_META[b].label}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-ink-3">{BLOCK_META[b].hint}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* schedule */}
              <p className="v-label mt-5">Schedule</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <SegmentedControl options={CADENCES} value={cadence} onChange={setCadence} id="builder-cadence" />
                <select
                  aria-label="Send day"
                  defaultValue="09:00"
                  className="rounded-md border border-line-strong bg-surface px-2 py-1.5 font-mono text-[12px] text-ink-1 outline-none focus:border-brand"
                >
                  {['08:00', '09:00', '12:00', '17:00'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* recipients */}
              <p className="v-label mt-5">Recipients</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2 py-1.5 focus-within:border-brand">
                {recipients.map((r) => (
                  <motion.span
                    key={r}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 py-0.5 pl-0.5 pr-1.5 text-[12px] text-ink-1"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full text-[8px] font-bold text-white" style={{ background: avatarGradient(r) }}>
                      {initials(r)}
                    </span>
                    {r}
                    <button type="button" aria-label={`Remove ${r}`} onClick={() => setRecipients((xs) => xs.filter((x) => x !== r))} className="text-ink-3 hover:text-ink-1">
                      <X size={12} />
                    </button>
                  </motion.span>
                ))}
                <input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  onBlur={addRecipient}
                  placeholder={recipients.length === 0 ? 'Add a name or email…' : ''}
                  className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-[12.5px] text-ink-1 outline-none placeholder:text-ink-3"
                />
              </div>

              {/* live preview */}
              <div className="mt-5 flex items-center gap-2">
                <p className="v-label">Live preview</p>
                <span className="v-live-dot" />
                <span className="ml-auto text-[11px] text-ink-3">drag to reorder</span>
              </div>
              <Reorder.Group
                axis="y"
                values={blocks}
                onReorder={setBlocks}
                className="mt-1.5 space-y-2 rounded-md border border-line bg-surface-2/50 p-2"
              >
                <AnimatePresence initial={false}>
                  {blocks.map((b) => (
                    <PreviewItem key={b} block={b} />
                  ))}
                  {blocks.length === 0 && (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-2 py-8 text-center text-[12px] text-ink-3"
                    >
                      Add blocks above to build your report.
                    </motion.p>
                  )}
                </AnimatePresence>
              </Reorder.Group>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onCreate({ name, blocks, cadence, recipients })}
                className="rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-white shadow-card transition-colors duration-150 hover:bg-brand-strong"
              >
                Create report
              </motion.button>
            </div>
    </motion.aside>
  );
}
