import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { fmtNumber } from '@/lib/live';

const PAGES = [
  { path: '/pricing', views: 18204, uniques: 12931 },
  { path: '/docs/getting-started', views: 14877, uniques: 11240 },
  { path: '/blog/churn-benchmarks', views: 11208, uniques: 9862 },
  { path: '/features/cohorts', views: 8941, uniques: 6204 },
  { path: '/integrations/slack', views: 7330, uniques: 5118 },
  { path: '/signup', views: 6902, uniques: 6487 },
];

export default function TopPages() {
  const max = Math.max(...PAGES.map((p) => p.views));

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.64, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="v-card col-span-12 xl:col-span-4"
      aria-label="Top pages"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink-1">Top pages</h2>
        <Link to="/analytics" className="flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-strong">
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.04em] text-ink-3">
              <th className="px-5 py-2 font-medium">Path</th>
              <th className="px-2 py-2 text-right font-medium">Views</th>
              <th className="px-2 py-2 text-right font-medium">Unique</th>
              <th className="px-5 py-2 text-right font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {PAGES.map((p, i) => (
              <motion.tr
                key={p.path}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.64 + i * 0.05, duration: 0.3 }}
                className="border-t border-line transition-colors duration-[120ms] hover:bg-surface-2"
              >
                <td className="max-w-0 truncate px-5 py-2.5 font-mono text-[12px] text-ink-1">{p.path}</td>
                <td className="tnum px-2 py-2.5 text-right font-medium text-ink-1">{fmtNumber(p.views)}</td>
                <td className="tnum px-2 py-2.5 text-right text-ink-2">{fmtNumber(p.uniques)}</td>
                <td className="px-5 py-2.5">
                  <div className="ml-auto h-1.5 w-16 overflow-hidden rounded-pill bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.views / max) * 100}%` }}
                      transition={{ delay: 0.7 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-pill bg-brand"
                    />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
