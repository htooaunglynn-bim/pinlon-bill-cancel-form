import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ClayIcon } from './ClayIcon';

type Tone = 'lav' | 'mint' | 'pink' | 'sun';

const HEADER: Record<Tone, string> = {
    lav:  'bg-lav',
    mint: 'bg-mint',
    pink: 'bg-pink',
    sun:  'bg-sun',
};

type Props = {
    title: ReactNode;
    icon: string;
    actions?: ReactNode;
    tone: Tone;
    intro?: ReactNode;
    children: ReactNode;
    delay?: number;
};

export function ClayCard({ title, icon, tone, intro, children, delay = 0, actions }: Props) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            className="clay-surface overflow-hidden rounded-clay bg-card print:shadow-none"
        >
            <header className={`flex items-center gap-3.5 px-6 py-5 sm:px-8 ${HEADER[tone]}`}>
                <ClayIcon name={icon} size={46} />
                <h2 className="flex-1 font-display text-[22px] leading-tight font-semibold text-clay-ink">{title}</h2>
                {actions}
            </header>

            <div className="px-6 py-6 sm:px-8 sm:py-7">
                {intro ? <div className="mb-5 space-y-3 text-[15px] text-clay-muted">{intro}</div> : null}
                {children}
            </div>
        </motion.section>
    );
}
