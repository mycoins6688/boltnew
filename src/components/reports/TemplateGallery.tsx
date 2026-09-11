import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import MiniPreview from './miniPreviews';
import type { Template } from './data';

/**
 * Template gallery — 3×2 card grid with live miniature chart previews
 * (design/reports.md §2). Hover lifts the card, re-animates the preview and
 * reveals the "Use template" button.
 */
export default function TemplateGallery({
  templates,
  onUse,
}: {
  templates: Template[];
  onUse: (t: Template) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <motion.section layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Report templates">
      <AnimatePresence mode="popLayout">
        {templates.map((t, i) => (
          <motion.article
            layout
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
            transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            onMouseEnter={() => setHovered(t.id)}
            onMouseLeave={() => setHovered(null)}
            className="v-card group flex h-[180px] cursor-pointer flex-col overflow-hidden transition-[border-color] duration-150 hover:border-line-strong"
            onClick={() => onUse(t)}
          >
            <div className="h-[96px] shrink-0 overflow-hidden border-b border-line bg-surface-2">
              <MiniPreview kind={t.preview} active={hovered === t.id} />
            </div>
            <div className="relative flex flex-1 flex-col justify-center px-4">
              <h3 className="text-[14px] font-semibold text-ink-1">{t.name}</h3>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-ink-3">{t.description}</p>
              <AnimatePresence>
                {hovered === t.id && (
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-brand shadow-card"
                  >
                    Use template
                    <ArrowRight size={13} />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </motion.section>
  );
}
