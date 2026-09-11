import { motion } from 'framer-motion';
import { Download, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import SectionCard from '@/components/settings/SectionCard';
import { EXPO, btnGhost, btnPrimary } from '@/components/settings/bits';

/* Rotating gradient border — registered once via a local <style> tag. */
const GRADIENT_STYLE = `
@property --v-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@keyframes v-angle-spin { to { --v-angle: 360deg; } }
.v-plan-border {
  background: conic-gradient(from var(--v-angle), #6366F1, #8B5CF6, #D946EF, #6366F1);
  animation: v-angle-spin 6s linear infinite;
}
@media (prefers-reduced-motion: reduce) { .v-plan-border { animation: none; } }
`;

const METERS = [
  { label: 'Events', used: '8.4M', total: '10M', pct: 84 },
  { label: 'API calls', used: '62M', total: '100M', pct: 62 },
  { label: 'Storage', used: '41GB', total: '100GB', pct: 41 },
] as const;

const INVOICES = [
  { id: 'INV-2031', date: 'Mar 1, 2025', amount: '$490.00' },
  { id: 'INV-2030', date: 'Feb 1, 2025', amount: '$490.00' },
  { id: 'INV-2029', date: 'Jan 1, 2025', amount: '$490.00' },
  { id: 'INV-2028', date: 'Dec 1, 2024', amount: '$451.00' },
] as const;

/** Billing tab — plan card, usage meters, invoices (settings.md §6). */
export default function BillingPanel() {
  return (
    <div className="flex flex-col gap-5">
      <style>{GRADIENT_STYLE}</style>

      {/* Plan card with rotating brand-gradient border */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EXPO }}
        className="v-plan-border rounded-[15px] p-[1px]"
      >
        <div className="v-card rounded-[14px] border-0 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink-1">Scale plan</h2>
                <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-brand">
                  Current
                </span>
              </div>
              <p className="tnum mt-1 text-[24px] font-semibold leading-8 text-ink-1">
                $490<span className="text-[13px] font-normal text-ink-3">/mo</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toast('Plan management is disabled in this demo')} className={btnGhost}>
                Manage plan
              </button>
              <button
                type="button"
                onClick={() => toast.success('Enterprise inquiry sent — our team will reach out (demo)')}
                className={btnPrimary}
              >
                Upgrade to Enterprise
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-2">Seats</span>
              <span className="font-mono text-ink-3">38 / 50</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '76%' }}
                transition={{ duration: 0.8, ease: EXPO }}
                className="h-full rounded-pill bg-brand"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <SectionCard title="Usage this cycle" description="Resets Apr 1, 2025." index={1}>
        <div className="flex flex-col gap-4">
          {METERS.map((m, i) => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink-2">{m.label}</span>
                <span className="font-mono text-ink-3">
                  {m.used} / {m.total}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: EXPO }}
                  className="h-full rounded-pill"
                  style={{ background: m.pct >= 80 ? 'var(--warning)' : 'var(--accent)' }}
                />
              </div>
              {m.pct >= 80 && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                  <TriangleAlert size={11} /> Approaching limit
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Invoices" description="Download any past invoice as a PDF." index={2}>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
                <th className="px-3 py-2.5">Invoice</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-line text-[13px] text-ink-1 transition-colors duration-150 last:border-b-0 hover:bg-surface-2"
                >
                  <td className="px-3 py-2.5 font-mono text-[12px]">{inv.id}</td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-2">{inv.date}</td>
                  <td className="tnum px-3 py-2.5 text-[12px]">{inv.amount}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-pill bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-success">
                      Paid
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toast.success(`${inv.id} PDF downloaded`)}
                      aria-label={`Download ${inv.id}`}
                      className="grid h-7 w-7 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
