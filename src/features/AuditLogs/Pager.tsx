import { ClayButton } from '@/components/ClayButton';
import type { PageMeta } from '@/lib/types';

type Props = {
    meta: PageMeta | null;
    onPage: (page: number) => void;
    busy: boolean;
};

export function Pager({ meta, onPage, busy }: Props) {
    if (!meta) return null;

    const { current_page: current, last_page: last, from, to, total } = meta;

    return (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-clay-edge pt-4">
            <p className="text-sm text-clay-muted">
                {total === 0 ? 'No rows' : `Showing ${from ?? 0}–${to ?? 0} of ${total}`}
            </p>

            <div className="flex items-center gap-2.5">
                <ClayButton
                    type="button" tone="ghost" compact
                    disabled={busy || current <= 1}
                    onClick={() => onPage(current - 1)}
                >
                    Prev
                </ClayButton>
                <span className="font-display text-sm font-semibold text-clay-muted">
                    Page {current} of {Math.max(last, 1)}
                </span>
                <ClayButton
                    type="button" tone="ghost" compact
                    disabled={busy || current >= last}
                    onClick={() => onPage(current + 1)}
                >
                    Next
                </ClayButton>
            </div>
        </div>
    );
}

/** The inset "nothing here" panel every feed shows in place of an empty list. */
export function EmptyState({ children }: { children: React.ReactNode }) {
    return (
        <div className="clay-inset mt-4 rounded-blob bg-cream/70 px-4 py-6 text-center text-[15px] text-clay-muted">
            {children}
        </div>
    );
}
