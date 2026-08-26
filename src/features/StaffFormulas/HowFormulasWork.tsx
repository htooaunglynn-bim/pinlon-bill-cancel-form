import { useState } from 'react';

/** The formula rules — reference material, so collapsible rather than always in the way. */
export function HowFormulasWork() {
    const [open, setOpen] = useState(true);

    return (
        <div className="clay-inset mt-4 rounded-blob bg-cream/70 px-4 py-3">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex w-full cursor-pointer items-center justify-between gap-3 font-display text-[15px] font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep"
            >
                <span>How formulas work</span>
                <span aria-hidden="true" className={`text-clay-muted transition-transform ${open ? 'rotate-180' : ''}`}>
                    &#9662;
                </span>
            </button>

            {open ? (
                <div className="mt-3 space-y-3 text-[15px] text-clay-muted">
                    <p>
                        Write a formula the plain way, e.g. <code>amount * tier_multiplier / percent</code>.
                        Points are always rounded <strong className="text-clay-ink">down</strong> automatically (1.9 &rarr; 1), so you never need to
                        round it yourself. Use <code>+ - * / ( )</code>.
                    </p>
                    <p>
                        <code>amount</code> and <code>tier_multiplier</code> are supplied by the system &mdash; every formula
                        must use <code>amount</code>, and neither can be declared or overridden. Any other name a formula uses
                        must be added with <strong className="text-clay-ink">+ Add variable</strong> on that row. Keep a <code>default</code> row: it is
                        used when no department is sent, when the department is unrecognized, or when a row's formula fails.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
