import type { ReactNode } from 'react';

/** `className` lets a caller re-tone the chip (mint/pink) without a second component. */
export function ClayChip({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <span className={`clay-inset inline-flex items-center gap-1 rounded-full bg-cream px-3.5 py-1.5 font-mono text-xs text-clay-ink ${className}`}>
            {children}
        </span>
    );
}
