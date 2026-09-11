import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Eye, EyeOff, KeyRound, MoreHorizontal, Plus, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import SectionCard, { FieldLabel } from '@/components/settings/SectionCard';
import { btnPrimary, btnSecondary, inputCls } from '@/components/settings/bits';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: number;
  name: string;
  secret: string; // full dummy secret
  created: string;
  lastUsed: string;
}

const randomSecret = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `vnt_live_${s}`;
};

const mask = (secret: string) => `vnt_live_••••••••${secret.slice(-4)}`;

const INITIAL_KEYS: ApiKey[] = [
  { id: 1, name: 'Production backend', secret: 'vnt_live_9k2md71xqp40bnv8c3ha4f2a', created: 'Jan 12, 2025', lastUsed: '2 min ago' },
  { id: 2, name: 'Staging CI', secret: 'vnt_live_zz41t0w8e7r5y6u2i9o0p1q2', created: 'Feb 3, 2025', lastUsed: '4 hours ago' },
  { id: 3, name: 'Metabase sync', secret: 'vnt_live_m4n5b6v7c8x9z0l1k2j3h4g5', created: 'Nov 28, 2024', lastUsed: 'Mar 13, 2025' },
];

let nextId = 4;

/** API Keys tab — create / reveal / regenerate / revoke (settings.md §5). */
export default function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [flashId, setFlashId] = useState<number | null>(null);
  const [spinningId, setSpinningId] = useState<number | null>(null);

  /* create dialog */
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [scopes, setScopes] = useState({ read: true, write: false });
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  /* confirm dialogs */
  const [regenTarget, setRegenTarget] = useState<ApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const flashRow = (id: number) => {
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1000);
  };

  const closeCreate = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      window.setTimeout(() => {
        setNewName('');
        setScopes({ read: true, write: false });
        setCreatedKey(null);
        setCopied(false);
      }, 200);
    }
  };

  const createKey = () => {
    const key: ApiKey = {
      id: nextId++,
      name: newName.trim() || 'Untitled key',
      secret: randomSecret(),
      created: 'Just now',
      lastUsed: 'Never',
    };
    setKeys((ks) => [key, ...ks]);
    setCreatedKey(key);
    flashRow(key.id);
  };

  const copyKey = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
    } catch {
      /* clipboard unavailable — demo */
    }
    setCopied(true);
    toast.success('API key copied to clipboard');
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const regenerate = () => {
    if (!regenTarget) return;
    const id = regenTarget.id;
    setRegenTarget(null);
    setSpinningId(id);
    window.setTimeout(() => {
      setKeys((ks) => ks.map((k) => (k.id === id ? { ...k, secret: randomSecret(), lastUsed: 'Never' } : k)));
      setSpinningId(null);
      flashRow(id);
      toast.success('Key regenerated — update your integrations');
    }, 400);
  };

  const revoke = () => {
    if (!revokeTarget) return;
    setKeys((ks) => ks.filter((k) => k.id !== revokeTarget.id));
    toast.success(`"${revokeTarget.name}" revoked`);
    setRevokeTarget(null);
  };

  const toggleReveal = (id: number) =>
    setRevealed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="API keys"
        description="Programmatic access to the Vantage API. Keys are shown in full only once, at creation."
        index={0}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-2 p-3">
          <div className="flex items-center gap-2.5 text-[12px] text-ink-2">
            <KeyRound size={15} className="shrink-0 text-brand" />
            Authenticate with an <span className="font-mono text-[11px] text-ink-1">Authorization: Bearer</span> header.
          </div>
          <button type="button" onClick={() => setCreateOpen(true)} className={btnPrimary}>
            <Plus size={15} /> Create key
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Key</th>
                <th className="px-3 py-2.5">Created</th>
                <th className="px-3 py-2.5">Last used</th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {keys.map((k) => (
                  <motion.tr
                    key={k.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'border-b border-line text-[13px] text-ink-1 transition-colors duration-1000 last:border-b-0 hover:bg-surface-2',
                      flashId === k.id && 'bg-[color-mix(in_srgb,var(--success)_14%,transparent)]',
                    )}
                  >
                    <td className="px-3 py-2.5 font-medium">{k.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5 font-mono text-[12px] text-ink-2">
                        {revealed.has(k.id) ? k.secret : mask(k.secret)}
                        <button
                          type="button"
                          onClick={() => toggleReveal(k.id)}
                          aria-label={revealed.has(k.id) ? 'Hide key' : 'Reveal key'}
                          className="grid h-6 w-6 place-items-center rounded-sm text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1"
                        >
                          {revealed.has(k.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-3">{k.created}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-ink-3">{k.lastUsed}</td>
                    <td className="px-3 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Actions for ${k.name}`}
                            className="grid h-7 w-7 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => setRegenTarget(k)}>
                            <RefreshCw size={14} className={cn('mr-2', spinningId === k.id && 'animate-spin')} />
                            Regenerate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setRevokeTarget(k)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 size={14} className="mr-2" /> Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Create key dialog */}
      <Dialog open={createOpen} onOpenChange={closeCreate}>
        <DialogContent className="sm:max-w-md">
          {createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle>Key created</DialogTitle>
                <DialogDescription>Copy it now — you won't be able to see it again.</DialogDescription>
              </DialogHeader>
              <div className="flex items-start gap-2 rounded-md border border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3 text-[12px] text-ink-2">
                <TriangleAlert size={15} className="mt-px shrink-0 text-warning" />
                Store this somewhere safe. Vantage only displays a key once.
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-line bg-surface-2 px-3 py-2.5 font-mono text-[12px] text-ink-1">
                  {createdKey.secret}
                </code>
                <button
                  type="button"
                  onClick={() => copyKey(createdKey.secret)}
                  aria-label="Copy API key"
                  className={btnSecondary + ' h-9 w-9 shrink-0 px-0'}
                >
                  {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                </button>
              </div>
              <DialogFooter className="mt-4">
                <button type="button" onClick={() => closeCreate(false)} className={btnPrimary}>
                  Done
                </button>
              </DialogFooter>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createKey();
              }}
            >
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>Name the key and choose its scopes.</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <FieldLabel>Key name</FieldLabel>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Warehouse sync"
                  className={inputCls}
                />
              </div>
              <div className="mt-4 flex gap-6">
                {(['read', 'write'] as const).map((scope) => (
                  <label key={scope} className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-1">
                    <Checkbox
                      checked={scopes[scope]}
                      onCheckedChange={(v) => setScopes((s) => ({ ...s, [scope]: v === true }))}
                    />
                    <span className="font-mono text-[12px]">{scope}</span>
                  </label>
                ))}
              </div>
              <DialogFooter className="mt-5">
                <button type="button" onClick={() => closeCreate(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary}>
                  Create key
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate confirm */}
      <AlertDialog open={!!regenTarget} onOpenChange={(o) => !o && setRegenTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate "{regenTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The current key stops working immediately. Any integration using it will need the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={regenerate}>Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke confirm */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke "{revokeTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently disables the key. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={revoke}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
