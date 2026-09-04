import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

type Props = {
    /** First line: the action or event name. */
    title: ReactNode;
    /** Second line: who did it, and where from. */
    subtitle?: ReactNode;
    /** Right-aligned, already formatted. */
    when: string;
    /** Small pills under the title. */
    chips?: ReactNode;
    /** Rendered only while expanded. */
    detail: ReactNode;
};

/**
 * One expandable log row.
 *
 * Open state is per-row and local, so paging or re-filtering collapses
 * everything without any extra bookkeeping.
 */
export function LogRow({ title, subtitle, when, chips, detail }: Props) {
    const [open, setOpen] = useState(false);
    const panelId = useId();

    return (
        <motion.li
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="clay-inset mt-3 rounded-blob bg-cream/70 px-4 py-3.5"
        >
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full cursor-pointer items-start gap-3 text-left focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lav-deep"
            >
                <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold text-clay-ink">{title}</p>
                    {subtitle ? <p className="mt-0.5 truncate text-sm text-clay-muted">{subtitle}</p> : null}
                    {chips ? <div className="mt-2 flex flex-wrap gap-1.5">{chips}</div> : null}
                </div>

                <div className="shrink-0 text-right">
                    <span className="block font-mono text-xs text-clay-muted">{when}</span>
                    <span className="mt-1.5 inline-block font-display text-sm font-semibold text-clay-muted" aria-hidden>
                        {open ? '− less' : '+ more'}
                    </span>
                </div>
            </button>

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        id={panelId}
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 space-y-3 border-t-2 border-dashed border-clay-edge pt-3">{detail}</div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.li>
    );
}

/** A label/value pair for the detail panel — the shape every feed's detail needs. */
export function DetailPair({ label, value }: { label: string; value: ReactNode }) {
    if (value === null || value === undefined || value === '') return null;

    return (
        <p className="text-sm">
            <span className="text-clay-muted">{label}: </span>
            <span className="font-mono text-[13px] break-all text-clay-ink">{value}</span>
        </p>
    );
}
