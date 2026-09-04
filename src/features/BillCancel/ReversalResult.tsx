import { ClayChip } from '@/components/ClayChip';
import type { BillCancelResult, BillReversal } from '@/lib/types';

function signed(points: number): string {
    return points > 0 ? `+${points}` : String(points);
}

const LEG_TONE: Record<BillReversal['reversal_type'], string> = {
    // Pink = points taken back off the balance, mint = points given back.
    refund: 'bg-pink/35 text-pink-deep',
    recharge: 'bg-mint/35 text-mint-deep',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="font-display text-xs font-semibold tracking-wide text-clay-muted uppercase">{label}</p>
            <p className="mt-0.5 text-[15px] break-words">{children}</p>
        </div>
    );
}

export function ReversalResult({ result }: { result: BillCancelResult }) {
    const net = result.net_points_change;

    return (
        <div className="clay-inset mt-6 rounded-clay bg-cream px-5 py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">Reversal</h3>
                <span
                    className={`font-display text-lg font-semibold ${net > 0 ? 'text-mint-deep' : net < 0 ? 'text-pink-deep' : 'text-clay-muted'}`}
                >
                    net {signed(net)} points
                </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Row label="Customer">{result.customer_name}</Row>
                <Row label="Cancelled at">{result.cancelled_at}</Row>
                <Row label="bill_id"><span className="font-mono text-sm">{result.bill_id}</span></Row>
                <Row label="redemption_id">
                    <span className="font-mono text-sm">{result.redemption_id ?? '—'}</span>
                </Row>
            </div>

            <ul className="mt-5 space-y-2.5">
                {result.reversals.map((reversal, index) => (
                    <li
                        key={`${reversal.reversal_type}-${reversal.reference_type}-${index}`}
                        className="clay-surface flex flex-wrap items-center gap-x-3 gap-y-2 rounded-blob bg-card px-4 py-3"
                    >
                        <ClayChip className={LEG_TONE[reversal.reversal_type]}>{reversal.reversal_type}</ClayChip>
                        <span className="font-mono text-xs text-clay-muted">
                            {reversal.original_type} · {reversal.reference_type}
                        </span>
                        <span className="ml-auto font-display font-semibold">
                            {reversal.points_reversed} points
                        </span>
                        <span className="w-full font-mono text-xs text-clay-muted">
                            balance after {reversal.points_balance_after} · {reversal.reversed_at}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-clay-edge pt-4">
                <span className="font-display text-[15px] font-semibold">
                    Balance now {result.points_balance_after}
                </span>
                {result.tier_changed_to ? (
                    <ClayChip className="bg-sun/40">tier → {result.tier_changed_to}</ClayChip>
                ) : (
                    <span className="text-sm text-clay-muted">tier unchanged</span>
                )}
            </div>
        </div>
    );
}
