import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import TemplateGallery from '@/components/reports/TemplateGallery';
import ScheduledTable from '@/components/reports/ScheduledTable';
import RecentExports from '@/components/reports/RecentExports';
import ReportBuilder from '@/components/reports/ReportBuilder';
import type { BuilderConfig } from '@/components/reports/ReportBuilder';
import { EXPORTS, INITIAL_SCHEDULED, TEMPLATES } from '@/components/reports/data';
import type { ExportFile, ScheduledReport, Template } from '@/components/reports/data';

/**
 * /reports — template gallery with live mini previews, scheduled reports
 * table with working toggles, report builder drawer, recent exports
 * (design/reports.md).
 */
export default function Reports() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [reports, setReports] = useState<ScheduledReport[]>(INITIAL_SCHEDULED);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderInitial, setBuilderInitial] = useState<BuilderConfig | null>(null);

  // 150ms debounce on search
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), 150);
    return () => window.clearTimeout(id);
  }, [query]);

  const filteredTemplates = useMemo(
    () =>
      debounced
        ? TEMPLATES.filter((t) => `${t.name} ${t.description}`.toLowerCase().includes(debounced))
        : TEMPLATES,
    [debounced],
  );

  const filteredReports = useMemo(
    () =>
      debounced
        ? reports.filter((r) => `${r.name} ${r.cadence}`.toLowerCase().includes(debounced))
        : reports,
    [debounced, reports],
  );

  const openBuilder = (initial: BuilderConfig | null) => {
    setBuilderInitial(initial);
    setBuilderOpen(true);
  };

  const handleUseTemplate = (t: Template) => {
    openBuilder({ name: t.name, blocks: t.blocks });
    toast.success('Template applied', { description: `${t.name} blocks loaded into the builder.` });
  };

  const handleToggle = (id: string) => {
    setReports((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        toast(r.active ? 'Report paused' : 'Report resumed', { description: r.name });
        return { ...r, active: !r.active };
      }),
    );
  };

  const handleRowAction = (id: string, action: 'edit' | 'duplicate' | 'send' | 'delete') => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    if (action === 'send') {
      setFlashId(id);
      window.setTimeout(() => setFlashId((v) => (v === id ? null : v)), 700);
      toast.success(`Sending to ${report.recipients.length} recipients…`, { description: report.name });
    } else if (action === 'duplicate') {
      const copy: ScheduledReport = { ...report, id: `r${Date.now()}`, name: `${report.name} (copy)`, active: false };
      setReports((rs) => [...rs, copy]);
      toast.success('Report duplicated', { description: copy.name });
    } else if (action === 'delete') {
      setReports((rs) => rs.filter((r) => r.id !== id));
      toast('Report deleted', { description: report.name });
    } else {
      openBuilder({ name: report.name, blocks: ['kpi', 'revenue', 'notes'] });
    }
  };

  const handleCreate = (cfg: BuilderConfig & { cadence: ScheduledReport['cadence']; recipients: string[] }) => {
    const created: ScheduledReport = {
      id: `r${Date.now()}`,
      name: cfg.name.trim() || 'Untitled report',
      cadence: cfg.cadence,
      recipients: cfg.recipients.length > 0 ? cfg.recipients : ['Ava Reyes'],
      lastSent: 'Not sent yet',
      active: true,
    };
    setReports((rs) => [created, ...rs]);
    setBuilderOpen(false);
    setFlashId(created.id);
    window.setTimeout(() => setFlashId((v) => (v === created.id ? null : v)), 900);
    toast.success('Report created — first send Monday 9:00', { description: created.name });
  };

  const handleDownload = (f: ExportFile) => {
    toast.success('Download started', { description: `${f.name} · ${f.size}` });
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="mr-auto">
          <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink-1">Reports</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">Build once, schedule forever — reports land in inboxes on autopilot.</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports & templates…"
            aria-label="Search reports and templates"
            className="w-64 max-w-full rounded-md border border-line-strong bg-surface py-2 pl-9 pr-3 text-[13px] text-ink-1 outline-none transition-colors duration-150 placeholder:text-ink-3 focus:border-brand"
          />
        </motion.div>
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openBuilder(null)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-card transition-colors duration-150 hover:bg-brand-strong"
        >
          <Plus size={15} />
          New report
        </motion.button>
      </motion.div>

      <TemplateGallery templates={filteredTemplates} onUse={handleUseTemplate} />

      <ScheduledTable
        reports={filteredReports}
        flashId={flashId}
        onToggle={handleToggle}
        onAction={handleRowAction}
        onClearSearch={() => setQuery('')}
        searching={debounced.length > 0}
      />

      <RecentExports exports={EXPORTS} onDownload={handleDownload} />

      <ReportBuilder
        open={builderOpen}
        initial={builderInitial}
        onClose={() => setBuilderOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
