import type { ButtonHTMLAttributes } from 'react';

type Tone = 'primary' | 'secondary' | 'ghost' | 'danger';

const TONES: Record<Tone, string> = {
    primary:   'bg-lav-deep text-white',
    secondary: 'bg-sun text-clay-ink',
    ghost:     'bg-card text-clay-ink',
    danger:    'bg-pink text-clay-ink',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: Tone;
    /** Small inline button (row actions) instead of the full-width default. */
    compact?: boolean;
};

export function ClayButton({ tone = 'primary', compact = false, className = '', ...props }: Props) {
    return (
        <button
            {...props}
            className={[
                'clay-pressable cursor-pointer rounded-blob font-display font-semibold',
                'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lav-deep',
                TONES[tone],
                compact ? 'px-4 py-2 text-sm' : 'w-full px-4 py-3.5 text-base',
                className,
            ].join(' ')}
        />
    );
}
