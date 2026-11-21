import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { ClayButton } from './ClayButton';

type Props = {
    open: boolean;
    title: string;
    children: ReactNode;
    confirmLabel?: string;
    tone?: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
};

/** Required before every POS call that changes data. Escape or the backdrop cancels. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', tone = 'primary', onConfirm, onCancel }: Props) {
    const confirmRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        confirmRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            previous?.focus();
        };
    }, [open, onCancel]);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    key="confirm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-clay-ink/35 p-4"
                    onClick={onCancel}
                >
                    <motion.div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-title"
                        initial={{ scale: 0.94, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        onClick={(e) => e.stopPropagation()}
                        className="clay-surface w-full max-w-md rounded-clay bg-card p-6 sm:p-7"
                    >
                        <h2 id="confirm-title" className="font-display text-xl font-semibold">{title}</h2>
                        <div className="mt-3 space-y-2 text-[15px] text-clay-muted">{children}</div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <ClayButton tone="ghost" compact type="button" onClick={onCancel}>Cancel</ClayButton>
                            <ClayButton ref={confirmRef} tone={tone} compact type="button" onClick={onConfirm}>{confirmLabel}</ClayButton>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
