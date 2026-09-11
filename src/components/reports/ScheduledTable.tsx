import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, MoreHorizontal, Pencil, Send, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { avatarGradient, initials } from '@/lib/live';
import { cn } from '@/lib/utils';
import type { ScheduledReport } from './data';

/**
 * Scheduled reports table (design/reports.md §3) — working status switches,
 * avatar stacks with hover fan-out, row action menu, success flash on send.
 */

const CADENCE_STYLE: Record<ScheduledReport['cadence'], string> = {
  Daily: 'bg-brand-soft text-brand',
  'Weekly Mon': 'bg-surface-2 text-ink-2',
  'Monthly 1st': 'bg-[rgba(139,92,246,0.12)] text-[#8B5CF6] dark:text-[#A78BFA]',
};

function AvatarStack({ names }: { names: string[] }) {
  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  return (
    <div className="group/stack flex items-center" title={names.join(', ')}>
      {shown.map((n, i) => (
        <span
          key={n}
          className="grid h-6 w-6 place-items-center rounded-full border-2 border-surface text-[8px] font-bold text-white transition-transform duration-200 group-hover/stack:translate-x-[calc(var(--fan)*1px)]"
          style={{ background: avatarGradient(n), marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i, ['--fan' as string]: i * 4 }}
        >
          {initials(n)}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="grid h-6 place-items-center rounded-full border-2 border-surface bg-surface-3 px-1 font-mono text-[9px] font-medium text-ink-2"
          style={{ marginLeft: -8 }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

function RowMenu({
  onAction,
}: {
  onAction: (action: 'edit' | 'duplicate' | 'send' | 'delete') => void;
}) {
  const [open, setOpen] = useState(false);
  const items = [
    { key: 'edit' as const, label: 'Edit', icon: Pencil },
    { key: 'duplicate' as const, label: 'Duplicate', icon: Copy },
    { key: 'send' as const, label: 'Send now', icon: Send },
    { key: 'delete' as const, label: 'Delete', icon: Trash2, danger: true },
  ];
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Report actions"
        onClick={() => setOpen((v) => !v)}
        className="grid h-7 w-7 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
      >
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-40 mt-1 w-36 rounded-md border border-line bg-surface p-1 shadow-pop"
            >
              {items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAction(it.key);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors duration-100',
                    it.danger ? 'text-danger hover:bg-[rgba(225,29,72,0.08)]' : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1',
                  )}
                >
                  <it.icon size={14} />
                  {it.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ScheduledTable({
  reports,
  flashId,
  onToggle,
  onAction,
  onClearSearch,
  searching,
}: {
  reports: ScheduledReport[];
  flashId: string | null;
  onToggle: (id: string) => void;
  onAction: (id: string, action: 'edit' | 'duplicate' | 'send' | 'delete') => void;
  onClearSearch: () => void;
  searching: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card overflow-hidden"
      aria-label="Scheduled reports"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Scheduled reports</h2>
        <span className="rounded-pill bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium text-ink-2">
          {reports.filter((r) => r.active).length} active
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <img src="/empty-reports.svg" alt="" className="h-32 w-auto" />
          <div>
            <p className="text-[15px] font-semibold text-ink-1">No reports match your search</p>
            <p className="mt-1 text-[13px] text-ink-3">Try a different keyword, or clear the search to see everything.</p>
          </div>
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-1 rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-1 shadow-card transition-colors duration-150 hover:bg-surface-2"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line">
                {['Report name', 'Cadence', 'Recipients', 'Last sent', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative border-b border-line last:border-0 hover:bg-surface-2"
                >
                  <td className="px-5 py-3">
                    {/* success flash on "Send now" */}
                    {flashId === r.id && (
                      <motion.span
                        key={flashId + r.id}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="pointer-events-none absolute inset-0 bg-[rgba(14,169,104,0.10)]"
                      />
                    )}
                    <span className="text-[13px] font-medium text-ink-1">{r.name}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-medium', CADENCE_STYLE[r.cadence])}>
                      {r.cadence}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <AvatarStack names={r.recipients} />
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-ink-2">{r.lastSent}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={r.active}
                        onCheckedChange={() => onToggle(r.id)}
                        aria-label={`${r.active ? 'Pause' : 'Resume'} ${r.name}`}
                        className="h-[18px] w-8 [&_[data-slot=switch-thumb]]:size-3.5"
                      />
                      <span className={cn('text-[12px]', r.active ? 'text-success' : 'text-ink-3')}>
                        {r.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <RowMenu onAction={(a) => onAction(r.id, a)} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {searching && reports.length > 0 && (
        <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-3">
          Showing {reports.length} matching report{reports.length === 1 ? '' : 's'}
        </p>
      )}
    </motion.section>
  );
}
