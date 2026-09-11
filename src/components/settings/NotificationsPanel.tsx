import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AtSign, Check, Gauge, Mail, Megaphone, ShieldAlert, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import SectionCard from '@/components/settings/SectionCard';
import { EXPO } from '@/components/settings/bits';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Channel = 'email' | 'push' | 'slack';
const CHANNELS: readonly Channel[] = ['email', 'push', 'slack'];
const CHANNEL_LABEL: Record<Channel, string> = { email: 'Email', push: 'Push', slack: 'Slack' };

interface Row {
  id: string;
  icon: typeof Mail;
  title: string;
  description: string;
  locked?: boolean;
  badge?: string;
}

const ROWS: readonly Row[] = [
  { id: 'product', icon: Megaphone, title: 'Product updates', description: 'New features and improvements, roughly monthly.' },
  { id: 'digest', icon: Mail, title: 'Weekly digest', description: 'A summary of your workspace metrics every Monday.' },
  { id: 'mentions', icon: AtSign, title: 'Mentions & comments', description: 'When a teammate mentions you or comments on your reports.' },
  { id: 'security', icon: ShieldAlert, title: 'Security alerts', description: 'Sign-ins from new devices and key changes.', locked: true },
  { id: 'usage', icon: Gauge, title: 'Usage limit warnings', description: 'Heads-up at 80% and 95% of plan limits.' },
  { id: 'customers', icon: UserPlus, title: 'New customer alerts', description: 'Real-time ping when a customer signs up.', badge: 'Real-time' },
];

interface RowState {
  enabled: boolean;
  channels: Record<Channel, boolean>;
}

const INITIAL: Record<string, RowState> = {
  product: { enabled: true, channels: { email: true, push: false, slack: false } },
  digest: { enabled: true, channels: { email: true, push: false, slack: false } },
  mentions: { enabled: true, channels: { email: true, push: true, slack: true } },
  security: { enabled: true, channels: { email: true, push: true, slack: false } },
  usage: { enabled: true, channels: { email: true, push: false, slack: true } },
  customers: { enabled: false, channels: { email: false, push: true, slack: true } },
};

const saved = () => toast.success('Preference saved', { duration: 1500 });

/** Notifications tab — toggle rows with per-row channel chips (settings.md §4). */
export default function NotificationsPanel() {
  const [state, setState] = useState(INITIAL);

  const toggleRow = (id: string, enabled: boolean) => {
    setState((s) => ({ ...s, [id]: { ...s[id], enabled } }));
    saved();
  };

  const toggleChannel = (id: string, channel: Channel) => {
    setState((s) => ({
      ...s,
      [id]: { ...s[id], channels: { ...s[id].channels, [channel]: !s[id].channels[channel] } },
    }));
    saved();
  };

  return (
    <SectionCard title="Notifications" description="Choose what Acme Inc. hears about, and where." index={0}>
      <div className="flex flex-col divide-y divide-line">
        {ROWS.map((row, i) => {
          const st = state[row.id];
          const Icon = row.icon;
          const rowBody = (
            <div className="flex items-start justify-between gap-4 py-4 first:pt-1">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink-1">{row.title}</span>
                    {row.badge && (
                      <span className="rounded-pill bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.05em] text-success">
                        {row.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-4 text-ink-3">{row.description}</p>
                </div>
              </div>
              <Switch
                checked={st.enabled}
                disabled={row.locked}
                onCheckedChange={(v) => toggleRow(row.id, v)}
                aria-label={row.title}
              />
            </div>
          );

          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: EXPO }}
            >
              {row.locked ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-not-allowed">{rowBody}</div>
                    </TooltipTrigger>
                    <TooltipContent side="left">Required</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                rowBody
              )}

              <AnimatePresence initial={false}>
                {st.enabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: EXPO }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 pb-4 pl-11">
                      {CHANNELS.map((ch, ci) => {
                        const on = st.channels[ch];
                        return (
                          <motion.button
                            key={ch}
                            type="button"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: ci * 0.06, duration: 0.2 }}
                            onClick={() => toggleChannel(row.id, ch)}
                            aria-pressed={on}
                            className={cn(
                              'flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150',
                              on
                                ? 'border-transparent bg-brand-soft text-brand'
                                : 'border-line text-ink-3 hover:border-line-strong hover:text-ink-2',
                            )}
                          >
                            {on && <Check size={11} strokeWidth={3} />}
                            {CHANNEL_LABEL[ch]}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}
