import { Link } from 'react-router-dom';
import type { CustomerBill } from '@/hooks/useCustomerBills';
import type { CustomerSession } from '@/context/CustomerSessionContext';
import { formatMmk, formatPoints, whenText } from '@/lib/dates';
import { ClayButton } from './ClayButton';
import { ClayCard } from './ClayCard';
import { ClayChip } from './ClayChip';

type Props = {
    session: CustomerSession | null;
    bills: CustomerBill[];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    onSelect: (bill: CustomerBill) => void;
    /** Currently filled Bill ID / Redemption ID, to mark the selected rows. */
    billId: string;
    redemptionId: string;
};

/** Today's bills of the customer signed in on the Customer app page, ready to pick for a cancel. */
export function CustomerBillsCard({ session, bills, loading, error, onRefresh, onSelect, billId, redemptionId }: Props) {
    if (!session) {
        return (
            <p className="clay-inset rounded-blob bg-cream px-4 py-3 text-sm text-clay-muted print-hide">
                Sign in a customer on <Link to="/mobile" className="font-semibold text-lav-deep underline">Customer app</Link> to list their bills here.
            </p>
        );
    }

    const c = session.profile;

    return (
        <ClayCard
            title="Customer's bills today"
            icon="formulas"
            tone="lav"
            intro={
                <p>
                    Bills for <strong>{c.name}</strong> (PID <code>{c.member_code}</code>). Pick one to fill the form. Earns fill <strong>Bill ID</strong>,
                    redeems fill <strong>Redemption ID</strong>.
                </p>
            }
            actions={
                <ClayButton tone="ghost" compact type="button" onClick={onRefresh} disabled={loading}>
                    {loading ? 'Loading…' : 'Refresh'}
                </ClayButton>
            }
        >
            {error ? <p className="mb-3 text-sm font-semibold text-pink-deep">{error}</p> : null}

            {bills.length === 0 ? (
                <p className="text-[15px] text-clay-muted">{loading ? 'Loading bills…' : 'No earns or redeems today for this customer.'}</p>
            ) : (
                <ul className="space-y-2.5">
                    {bills.map((b) => {
                        const selected = b.kind === 'earn' ? billId.trim() === b.billId : redemptionId.trim() === b.billId;
                        const disabled = b.cancelled || b.unclaimed;
                        return (
                            <li
                                key={`${b.kind}|${b.billId}|${b.unclaimed}`}
                                className={`clay-inset flex flex-wrap items-center gap-x-3 gap-y-2 rounded-blob px-4 py-3 ${selected ? 'bg-lav/35' : 'bg-cream'}`}
                            >
                                <div className="min-w-0 flex-1 basis-56">
                                    <p className="truncate font-mono text-sm font-semibold" title={b.billId}>{b.billId}</p>
                                    <p className="text-xs text-clay-muted">
                                        {whenText(b.at)}
                                        {b.amount !== null && Number.isFinite(b.amount) ? ` · ${formatMmk(b.amount)}` : ''}
                                    </p>
                                </div>
                                <ClayChip className={b.kind === 'earn' ? '!bg-mint/50' : '!bg-sun/70'}>
                                    {b.kind === 'earn' ? 'Earn' : 'Redeem'}
                                    {!b.unclaimed ? ` ${b.kind === 'earn' ? '+' : '−'}${formatPoints(b.points)} pts` : ''}
                                </ClayChip>
                                {b.cancelled ? (
                                    <ClayChip className="!bg-pink/40">Cancelled</ClayChip>
                                ) : b.unclaimed ? (
                                    <ClayChip className="text-clay-muted" >Not claimed yet</ClayChip>
                                ) : (
                                    <ClayButton
                                        tone={selected ? 'secondary' : 'ghost'}
                                        compact
                                        type="button"
                                        onClick={() => onSelect(b)}
                                        disabled={disabled}
                                        aria-pressed={selected}
                                    >
                                        {selected ? 'Selected' : 'Select'}
                                    </ClayButton>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {bills.some((b) => b.unclaimed) ? (
                <p className="mt-3 text-sm text-clay-muted">
                    "Not claimed yet" invoices were made here for this PID but the customer hasn't scanned them. They can be cancelled once claimed.
                </p>
            ) : null}
        </ClayCard>
    );
}
