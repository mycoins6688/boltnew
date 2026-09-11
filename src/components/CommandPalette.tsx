import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChartBar as BarChart3, ChartBar as FileBarChart2, LayoutDashboard, Moon, Pause, Play, Settings, Sun, Users } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useTheme } from '@/hooks/useTheme';
import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { COMPANIES } from '@/lib/live';

/** ⌘K command palette — pages, actions, customers (design.md §6.2). */
export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { resolvedTheme, toggle } = useTheme();
  const { live, toggleLive } = useLiveMetrics();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} showCloseButton={false}>
      <CommandInput placeholder="Search pages, customers, actions…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <img src="/empty-search.svg" alt="" className="h-28 w-auto opacity-90" />
            <p className="text-[13px] text-ink-3">No results found.</p>
          </div>
        </CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go('/')}><LayoutDashboard size={15} className="mr-2" /> Overview</CommandItem>
          <CommandItem onSelect={() => go('/analytics')}><BarChart3 size={15} className="mr-2" /> Analytics</CommandItem>
          <CommandItem onSelect={() => go('/reports')}><FileBarChart2 size={15} className="mr-2" /> Reports</CommandItem>
          <CommandItem onSelect={() => go('/customers')}><Users size={15} className="mr-2" /> Customers</CommandItem>
          <CommandItem onSelect={() => go('/settings')}><Settings size={15} className="mr-2" /> Settings</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { toggle(); }}>
            {resolvedTheme === 'dark' ? <Sun size={15} className="mr-2" /> : <Moon size={15} className="mr-2" />}
            Toggle theme
            <CommandShortcut>⇧T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { toggleLive(); onOpenChange(false); }}>
            {live ? <Pause size={15} className="mr-2" /> : <Play size={15} className="mr-2" />}
            {live ? 'Pause live data' : 'Resume live data'}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Customers">
          {COMPANIES.slice(0, 8).map((c) => (
            <CommandItem key={c} onSelect={() => go('/customers')}>
              <Users size={15} className="mr-2" /> {c}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
