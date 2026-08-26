import { AnimatePresence, motion } from 'motion/react';
import type { Status } from '@/hooks/useStatus';
import { ClayIcon } from './ClayIcon';

const TONE = {
    idle:    { text: 'text-clay-muted',    bg: 'bg-cream',         icon: null },
    busy:    { text: 'text-clay-muted',    bg: 'bg-cream',         icon: null },
    error:   { text: 'text-pink-deep',     bg: 'bg-pink/25',       icon: 'error' },
    success: { text: 'text-mint-deep',     bg: 'bg-mint/30',       icon: 'success' },
} as const;

export function StatusMessage({ status, id }: { status: Status; id?: string }) {
    const tone = TONE[status.state];

    return (
        <div id={id} aria-live="polite" className="mt-4 min-h-[8px]">
            <AnimatePresence initial={false}>
                {status.text ? (
                    <motion.div
                        key={status.text + status.state}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`clay-inset flex items-start gap-2.5 rounded-blob px-4 py-3 ${tone.bg}`}
                    >
                        {tone.icon ? <ClayIcon name={tone.icon} size={22} className="mt-0.5 shrink-0" /> : null}
                        <div className="min-w-0">
                            <p className={`font-semibold ${tone.text}`}>{status.text}</p>
                            {status.logs.map((line, index) => (
                                <p key={index} className="mt-1 text-sm break-words text-clay-muted">{line}</p>
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
