import { useState, type ReactNode, type TextareaHTMLAttributes } from 'react';

// Small Clay building blocks shared by every page.

export function ClayTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={[
                'clay-inset w-full rounded-blob border-0 bg-cream px-4 py-3 font-mono text-[14px] text-clay-ink',
                'placeholder:text-clay-muted/55',
                'focus:outline-3 focus:outline-offset-2 focus:outline-lav-deep',
                className,
            ].join(' ')}
        />
    );
}

/** Inline field error under an input. */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
    if (!children) return null;
    return (
        <p id={id} className="mt-1.5 text-sm font-semibold text-pink-deep">
            {children}
        </p>
    );
}

export function FieldWarning({ children }: { children?: ReactNode }) {
    if (!children) return null;
    return <p className="mt-1.5 text-sm font-semibold text-clay-ink/80">⚠ {children}</p>;
}

type Option<T extends string> = { value: T; label: ReactNode };

/** Segmented control. The selected segment is pressed into the clay (rule 2). */
export function Segmented<T extends string>({
    value,
    options,
    onChange,
    label,
}: {
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <div role="radiogroup" aria-label={label} className="clay-inset inline-flex flex-wrap gap-1.5 rounded-blob bg-cream p-1.5">
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(opt.value)}
                        className={[
                            'cursor-pointer rounded-[14px] px-4 py-2 font-display text-sm font-semibold',
                            'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep',
                            active ? 'clay-inset bg-lav text-clay-ink' : 'clay-pressable bg-card text-clay-muted',
                        ].join(' ')}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Label/value grid for result details. */
export function KeyValue({ rows }: { rows: [ReactNode, ReactNode][] }) {
    return (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-[max-content_1fr]">
            {rows.map(([k, v], i) => (
                <div key={i} className="contents">
                    <dt className="font-display text-sm font-semibold text-clay-muted">{k}</dt>
                    <dd className="min-w-0 break-words text-[15px]">{v ?? '-'}</dd>
                </div>
            ))}
        </dl>
    );
}

export function Stat({ label, value, tone = 'lav' }: { label: string; value: ReactNode; tone?: 'lav' | 'mint' | 'pink' | 'sun' }) {
    const bg = { lav: 'bg-lav/40', mint: 'bg-mint/40', pink: 'bg-pink/35', sun: 'bg-sun/50' }[tone];
    return (
        <div className={`clay-inset rounded-blob px-4 py-3.5 ${bg}`}>
            <p className="font-display text-xs font-semibold tracking-wide text-clay-muted uppercase">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-clay-ink">{value}</p>
        </div>
    );
}

export function Divider() {
    return <hr className="my-6 border-0 border-t-2 border-dashed border-clay-edge" />;
}

export function JsonBlock({ value, label = 'JSON' }: { value: unknown; label?: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="cursor-pointer font-display text-sm font-semibold text-lav-deep underline-offset-2 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep"
            >
                {open ? '▾' : '▸'} {label}
            </button>
            {open ? (
                <pre className="clay-inset mt-2 max-h-80 overflow-auto rounded-blob bg-cream p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify(value, null, 2)}
                </pre>
            ) : null}
        </div>
    );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print-hide">
            <div>
                <h1 className="font-display text-[30px] leading-tight font-bold text-clay-ink">{title}</h1>
                {subtitle ? <p className="mt-1 text-[15px] text-clay-muted">{subtitle}</p> : null}
            </div>
            {children}
        </div>
    );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; id: string }) {
    return (
        <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3 font-display text-[15px] font-semibold">
            <span className="relative inline-block">
                <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
                <span className={`clay-inset block h-8 w-14 rounded-full transition-colors ${checked ? 'bg-mint' : 'bg-cream'}`} />
                <span
                    className={`clay-pressable absolute top-1 block h-6 w-6 rounded-full bg-card transition-transform peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lav-deep ${checked ? 'translate-x-7' : 'translate-x-1'}`}
                />
            </span>
            {label}
        </label>
    );
}
