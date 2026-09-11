import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExportFile } from './data';

/**
 * Recent exports — 3-column list cards (design/reports.md §4).
 * Download button tap-scales 0.9 and its icon morphs to a check for 300ms+.
 */
export default function RecentExports({
  exports,
  onDownload,
}: {
  exports: ExportFile[];
  onDownload: (f: ExportFile) => void;
}) {
  const [doneId, setDoneId] = useState<string | null>(null);

  const handle = (f: ExportFile) => {
    onDownload(f);
    setDoneId(f.id);
    window.setTimeout(() => setDoneId((v) => (v === f.id ? null : v)), 1200);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Recent exports"
    >
      <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Recent exports</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {exports.map((f, i) => {
          const Icon = f.kind === 'pdf' ? FileText : FileSpreadsheet;
          const done = doneId === f.id;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="v-card flex items-center gap-3 p-4"
            >
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-md',
                  f.kind === 'pdf' ? 'bg-[rgba(225,29,72,0.10)] text-danger' : 'bg-[rgba(14,169,104,0.10)] text-success',
                )}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] font-medium text-ink-1">{f.name}</p>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {f.size} · {f.time}
                </p>
              </div>
              <motion.button
                type="button"
                aria-label={`Download ${f.name}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => handle(f)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
              >
                {done ? <Check size={15} className="text-success" /> : <Download size={15} />}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
