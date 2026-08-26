import type { ReactNode } from 'react';

type Props = {
    label: ReactNode;
    hint?: ReactNode;
    htmlFor?: string;
    children: ReactNode;
    className?: string;
};

export function ClayField({ label, hint, htmlFor, children, className = '' }: Props) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="mb-2 block font-display text-[15px] font-semibold text-clay-ink">
                {label}
                {hint ? <span className="ml-1 font-sans text-sm font-normal text-clay-muted">{hint}</span> : null}
            </label>
            {children}
        </div>
    );
}
