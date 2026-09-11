import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ExternalLink, FileText, Mail, MoreHorizontal, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import SegmentedControl from '@/components/SegmentedControl';
import Sparkline from '@/components/Sparkline';
import { useCountUp } from '@/hooks/useCountUp';
import { avatarGradient, initials, seededSeries } from '@/lib/live';
import { cn } from '@/lib/utils';
import { healthTone } from './data';
import type { Customer, Plan, Status } from './data';

/**
 * Customer detail drawer — right-side 560px panel with scrim
 * (design/customers.md §4): KPI mini-row, Usage/Billing/Activity tabs,
 * timeline, notes.
 */

const TABS = ['Usage', 'Billing', 'Activity'] as const;
type Tab = (typeof TABS)[number];

const PLAN_STYLE: Record<Plan, string> = {
  Enterprise: 'bg-[rgba(139,92,246,0.12)] text-[#8B5CF6] dark:text-[#A78BFA]',
  Scale: 'bg-brand-soft text-brand',
  Starter: 'bg-surface-2 text-ink-2',
};

const STATUS_STYLE: Record<Status, string> = {
  Active: 'bg-[rgba(14,169,104,0.10)] text-success',
  Trialing: 'bg-[rgba(2,132,199,0.10)] text-info',
  'Past due': 'bg-[rgba(217,119,6,0.10)] text-warning',
  Churned: 'bg-[rgba(225,29,72,0.10)] text-danger',
};

function MiniKpi({ label, value, index }: { label: string; value: number; index: number }) {
  const v = useCountUp(value, 700);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-md border border-line bg-surface-2 px-3 py-2.5"
    >
      <p className="v-label">{label}</p>
      <p className="mt-0.5 text-[17px] font-semibold text-ink-1 tnum">
        {label === 'MRR' ? `$${Math.round(v).toLocaleString('en-US')}` : Math.round(v)}
      </p>
    </motion.div>
  );
}

function UsageTab({ c }: { c: Customer }) {
  const data = seededSeries(700 + c.id, 30, 40 + c.health / 2, 8, 0.3);
  const tone = healthTone(c.health);
  const barColor = tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-line bg-surface-2 p-3">
        <p className="v-label mb-2">Events volume · 30 days</p>
        <Sparkline data={data} width={480} height={72} color="var(--accent)" />
      </div>
      {[
        { label: 'API calls', value: c.apiCalls, pct: Math.min(96, parseFloat(c.apiCalls) * 28) },
        { label: 'Active seats', value: `${c.activeSeats}/${c.seats}`, pct: (c.activeSeats / c.seats) * 100 },
      ].map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-24 text-[12.5px] text-ink-2">{row.label}</span>
          <div className="h-1.5 w-12 flex-1 overflow-hidden rounded-pill bg-surface-3">
            <motion.div
              className="h-full rounded-pill"
              initial={{ width: 0 }}
              animate={{ width: `${row.pct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: barColor }}
            />
          </div>
          <span className="font-mono text-[12px] text-ink-1 tnum">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function BillingTab({ c }: { c: Customer }) {
  const invoices = [
    { id: `INV-${2041 - (c.id % 7)}`, date: 'Mar 1, 2025', amount: c.mrr },
    { id: `INV-${1988 - (c.id % 5)}`, date: 'Feb 1, 2025', amount: c.mrr },
    { id: `INV-${1902 - (c.id % 4)}`, date: 'Jan 1, 2025', amount: Math.round(c.mrr * 0.94) },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-line bg-surface-2 p-4">
        <div className="flex items-center justify-between">
          <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-medium', PLAN_STYLE[c.plan])}>{c.plan}</span>
          <span className="font-mono text-[13px] font-semibold text-ink-1">${c.annual.toLocaleString('en-US')}/yr</span>
        </div>
        <p className="mt-2 text-[12.5px] text-ink-2">Renews {c.renews} · {c.seats} seats · billed annually</p>
      </div>
      <div>
        <p className="v-label mb-2">Recent invoices</p>
        <div className="divide-y divide-line rounded-md border border-line">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5">
              <FileText size={14} className="text-ink-3" />
              <span className="font-mono text-[12px] font-medium text-ink-1">{inv.id}</span>
              <span className="text-[12px] text-ink-3">{inv.date}</span>
              <span className="ml-auto font-mono text-[12px] text-ink-1 tnum">${inv.amount.toLocaleString('en-US')}</span>
              <button
                type="button"
                onClick={() => toast.success('Invoice PDF downloaded', { description: `${inv.id}.pdf` })}
                className="text-[12px] font-medium text-brand hover:underline"
              >
                PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ c }: { c: Customer }) {
  const items = [
    { text: `Upgraded to ${c.plan}`, when: 'Mar 2' },
    { text: `Added ${Math.max(2, Math.round(c.seats / 4))} seats`, when: 'Feb 18' },
    { text: 'API key regenerated', when: 'Feb 11' },
    { text: `Invoice paid $${c.mrr.toLocaleString('en-US')}`, when: 'Feb 1' },
    { text: `Health recovered ${Math.max(10, c.health - 14)}→${c.health}`, when: 'Jan 22' },
    { text: 'Onboarding completed', when: 'Jan 9' },
  ];
  return (
    <div className="relative pl-5">
      {/* rail draws top-down on first open */}
      <motion.span
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-2 left-[5px] top-2 w-px origin-top bg-brand"
        style={{ opacity: 0.5 }}
      />
      <ul className="space-y-4">
        {items.map((it, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand" />
            <p className="text-[13px] text-ink-1">{it.text}</p>
            <p className="font-mono text-[11px] text-ink-3">{it.when}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default function CustomerDrawer({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {customer && (
        <>
          <motion.button
            type="button"
            aria-label="Close customer detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />
          <DrawerPanel key={customer.id} customer={customer} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  );
}

/** Inner panel — remounts per customer (key), so state needs no reset effect. */
function DrawerPanel({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('Usage');
  const [menuOpen, setMenuOpen] = useState(false);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Array<{ id: number; text: string; when: string }>>([]);

  const postNote = () => {
    const text = note.trim();
    if (!text) return;
    setNotes((ns) => [{ id: Date.now(), text, when: 'Just now' }, ...ns]);
    setNote('');
    toast.success('Note posted');
  };

  const menuItems = [
    { label: 'Send email', icon: Mail, run: () => toast.success('Email composer opened', { description: customer?.name }) },
    { label: 'Edit', icon: Pencil, run: () => toast('Edit customer', { description: 'Profile editor coming soon.' }) },
    { label: 'Archive', icon: Archive, run: () => toast('Customer archived', { description: customer?.name }) },
  ];

  return (
    <motion.aside
      role="dialog"
      aria-label={`Customer detail — ${customer.name}`}
            initial={{ x: 560 }}
            animate={{ x: 0 }}
            exit={{ x: 560 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-[560px] max-w-full flex-col border-l border-line bg-surface shadow-pop"
          >
            {/* header */}
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white" style={{ background: avatarGradient(customer.name) }}>
                  {initials(customer.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-semibold leading-6 text-ink-1">{customer.name}</h2>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">
                    <span className="font-mono">{customer.domain}</span> · Customer since {customer.since}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-medium', PLAN_STYLE[customer.plan])}>{customer.plan}</span>
                    <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-medium', STATUS_STYLE[customer.status])}>{customer.status}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast('Opening in CRM…', { description: customer.name })}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
                >
                  <ExternalLink size={13} />
                  Open in CRM
                </button>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="More actions"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <>
                        <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 z-40 mt-1 w-40 rounded-md border border-line bg-surface p-1 shadow-pop"
                        >
                          {menuItems.map((it) => (
                            <button
                              key={it.label}
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                it.run();
                              }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink-1"
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
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* KPI mini-row */}
              <div className="grid grid-cols-3 gap-2">
                <MiniKpi label="MRR" value={customer.mrr} index={0} />
                <MiniKpi label="Seats" value={customer.seats} index={1} />
                <MiniKpi label="Health" value={customer.health} index={2} />
              </div>

              {/* tabs */}
              <div className="mt-4">
                <SegmentedControl options={TABS} value={tab} onChange={setTab} id="customer-tabs" />
              </div>
              <div className="mt-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={tab + customer.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === 'Usage' && <UsageTab c={customer} />}
                    {tab === 'Billing' && <BillingTab c={customer} />}
                    {tab === 'Activity' && <ActivityTab c={customer} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* notes */}
              <div className="mt-5 border-t border-line pt-4">
                <p className="v-label mb-2">Notes</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note…"
                  rows={2}
                  className="w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink-1 outline-none transition-colors duration-150 placeholder:text-ink-3 focus:border-brand"
                />
                <div className="mt-2 flex justify-end">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={postNote}
                    disabled={!note.trim()}
                    className="rounded-md bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors duration-150 hover:bg-brand-strong disabled:opacity-40"
                  >
                    Post
                  </motion.button>
                </div>
                <ul className="mt-3 space-y-2">
                  <AnimatePresence initial={false}>
                    {notes.map((n) => (
                      <motion.li
                        key={n.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-md border border-line bg-surface-2 px-3 py-2"
                      >
                        <p className="text-[13px] text-ink-1">{n.text}</p>
                        <p className="mt-0.5 font-mono text-[10.5px] text-ink-3">Ava Reyes · {n.when}</p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>
    </motion.aside>
  );
}
