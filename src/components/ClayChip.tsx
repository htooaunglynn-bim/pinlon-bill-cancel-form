import type { ReactNode } from 'react';

export function ClayChip({ children }: { children: ReactNode }) {
    return (
        <span className="clay-inset inline-flex items-center gap-1 rounded-full bg-cream px-3.5 py-1.5 font-mono text-xs text-clay-ink">
            {children}
        </span>
    );
}
