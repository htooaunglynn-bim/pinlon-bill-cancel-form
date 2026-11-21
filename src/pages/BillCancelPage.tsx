import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CustomerBillsCard } from '@/components/CustomerBillsCard';
import { StatusMessage } from '@/components/StatusMessage';
import { ClayTextarea, FieldError, JsonBlock, KeyValue, PageHeader, Stat } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { useCustomerBills, type CustomerBill } from '@/hooks/useCustomerBills';
import { usePosCall } from '@/hooks/usePosCall';
import { posApi } from '@/lib/api';
import { formatPoints, whenText } from '@/lib/dates';
import { usePrefs } from '@/lib/prefs';
import { compact } from '@/lib/query';
import type { BillCancelResult } from '@/lib/types';

export function BillCancelPage() {
    const { tenant } = useTenant();
    const prefs = usePrefs();
    const [params] = useSearchParams();
    const [billId, setBillId] = useState(params.get('bill') ?? '');
    const [redemptionId, setRedemptionId] = useState(params.get('redemption') ?? '');
    const [reason, setReason] = useState('');
    const [locationId, setLocationId] = useState(prefs.defaultLocationId);
    const [confirming, setConfirming] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const call = usePosCall<BillCancelResult>();
    const customerBills = useCustomerBills();
    const [autoNote, setAutoNote] = useState<string | null>(null);

    // Fill Bill ID from the signed-in customer's only cancellable earn today, unless a link
    // already supplied one. Once per page visit; the user can still change it.
    const autoFilled = useRef(Boolean(params.get('bill') || params.get('redemption')));
    useEffect(() => {
        if (autoFilled.current || customerBills.loading) return;
        const open = customerBills.bills.filter((b) => b.kind === 'earn' && !b.cancelled && !b.unclaimed);
        if (open.length !== 1 || billId.trim()) return;
        autoFilled.current = true;
        setBillId(open[0].billId);
        setAutoNote(`Filled from ${customerBills.session?.profile.name ?? 'the customer'}'s bill today.`);
    }, [customerBills.bills, customerBills.loading]);

    function selectBill(b: CustomerBill) {
        setAutoNote(null);
        call.reset();
        if (b.kind === 'earn') {
            setBillId(b.billId);
        } else {
            setRedemptionId(b.billId);
            // Bill ID is required by the API; a redeem-only cancel repeats the reference there.
            if (!billId.trim()) setBillId(b.billId);
        }
    }

    const errors = {
        billId: !billId.trim() ? 'Bill ID is required.' : billId.length > 100 ? 'At most 100 characters.' : undefined,
        redemptionId: redemptionId.length > 100 ? 'At most 100 characters.' : undefined,
        reason: reason.length > 500 ? 'At most 500 characters.' : undefined,
        locationId: locationId && !/^\d+$/.test(locationId) ? 'Location ID must be a number.' : undefined,
    };
    const valid = !Object.values(errors).some(Boolean);
    const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);

    function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitted(true);
        if (valid) setConfirming(true);
    }

    async function send() {
        setConfirming(false);
        const body = compact({ bill_id: billId, redemption_id: redemptionId, reason, location_id: locationId ? Number(locationId) : undefined });
        const result = await call.run(
            () => posApi<BillCancelResult>(tenant, '/bill/cancel', {
                method: 'POST',
                json: body,
                log: { kind: 'bill-cancel', summary: `Cancel bill ${billId}${redemptionId ? ` + ${redemptionId}` : ''}`, meta: { bill: billId } },
            }),
            (d) => `Bill cancelled. Net change ${d.net_points_change > 0 ? '+' : ''}${formatPoints(d.net_points_change)} points.`,
        );
        // Show the row as cancelled.
        void customerBills.refresh();
        if (!result.ok && result.payload.error_code === 'BILL_ALREADY_CANCELLED') {
            call.say('Already cancelled. Nothing more to do.', 'success', ['A repeat cancel is safe; the bill was voided earlier.']);
        }
    }

    const d = call.data;

    return (
        <div className="space-y-7">
            <PageHeader title="Bill cancel" subtitle="Void a bill's points: refund an earn, recharge a redeem, or both at once. Same day only." />

            <CustomerBillsCard
                session={customerBills.session}
                bills={customerBills.bills}
                loading={customerBills.loading}
                error={customerBills.error}
                onRefresh={() => void customerBills.refresh()}
                onSelect={selectBill}
                billId={billId}
                redemptionId={redemptionId}
            />

            <ClayCard
                title="Cancel a bill"
                icon="error"
                tone="pink"
                intro={
                    <>
                        <p><strong>Bill ID</strong> is the earn reference (the POS reference, or the BID from an invoice QR). Its points are taken back.</p>
                        <p><strong>Redemption ID</strong> (optional) is the redeem reference or point-payment UUID. Its points are given back.</p>
                        <p>Only bills from today (Asia/Yangon) can be cancelled, and only if the earned points haven't been spent.</p>
                    </>
                }
            >
                <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" noValidate>
                    <ClayField label="Bill ID" htmlFor="bill">
                        <ClayInput id="bill" mono value={billId} onChange={(e) => { setBillId(e.target.value); setAutoNote(null); }} placeholder="BILL-20261121-ABC123" aria-invalid={!!show('billId')} />
                        <FieldError>{show('billId')}</FieldError>
                        {autoNote ? <p className="mt-1.5 text-sm text-mint-deep">✓ {autoNote}</p> : null}
                    </ClayField>
                    <ClayField label="Redemption ID" hint="(optional)" htmlFor="redemption">
                        <ClayInput id="redemption" mono value={redemptionId} onChange={(e) => setRedemptionId(e.target.value)} aria-invalid={!!show('redemptionId')} />
                        <FieldError>{show('redemptionId')}</FieldError>
                    </ClayField>
                    <ClayField label="Location ID" hint="(optional)" htmlFor="location">
                        <ClayInput id="location" inputMode="numeric" value={locationId} onChange={(e) => setLocationId(e.target.value.trim())} aria-invalid={!!show('locationId')} />
                        <FieldError>{show('locationId')}</FieldError>
                    </ClayField>
                    <ClayField label="Reason" hint={`(optional, ${reason.length}/500)`} htmlFor="reason" className="sm:col-span-2">
                        <ClayTextarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="font-sans" placeholder="Customer returned the item" />
                        <FieldError>{show('reason')}</FieldError>
                    </ClayField>
                    <div className="sm:col-span-2">
                        <ClayButton type="submit" tone="danger" disabled={call.busy}>{call.busy ? 'Cancelling…' : 'Cancel bill'}</ClayButton>
                    </div>
                </form>
                <StatusMessage status={call.status} />
            </ClayCard>

            {d ? (
                <ClayCard title="Reversal" icon="success" tone="mint" delay={0.05}>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Stat label="Net change" value={`${d.net_points_change > 0 ? '+' : ''}${formatPoints(d.net_points_change)}`} tone={d.net_points_change < 0 ? 'pink' : 'mint'} />
                        <Stat label="Balance after" value={formatPoints(d.points_balance_after)} tone="lav" />
                        <Stat label="Tier" value={d.tier_changed_to ?? 'Unchanged'} tone="sun" />
                    </div>

                    <ul className="mt-6 space-y-3">
                        {d.reversals.map((r, i) => (
                            <li key={i} className={`clay-inset rounded-blob px-4 py-3 ${r.reversal_type === 'refund' ? 'bg-pink/25' : 'bg-mint/30'}`}>
                                <p className={`font-display font-semibold ${r.reversal_type === 'refund' ? 'text-pink-deep' : 'text-mint-deep'}`}>
                                    {r.reversal_type === 'refund' ? `Refund: −${formatPoints(r.points_reversed)} points (earn taken back)` : `Recharge: +${formatPoints(r.points_reversed)} points (redeem given back)`}
                                </p>
                                <p className="text-sm text-clay-muted">
                                    {r.reference_type} · balance after {formatPoints(r.points_balance_after)} · {whenText(r.reversed_at)}
                                </p>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6">
                        <KeyValue
                            rows={[
                                ['Customer', d.customer_name],
                                ['Bill ID', <code key="b">{d.bill_id}</code>],
                                ['Redemption ID', d.redemption_id ? <code key="r">{d.redemption_id}</code> : '-'],
                                ['Cancelled at', whenText(d.cancelled_at)],
                            ]}
                        />
                    </div>
                    <div className="mt-5">
                        <JsonBlock value={d} label="Raw response" />
                    </div>
                </ClayCard>
            ) : null}

            <ConfirmDialog open={confirming} title="Cancel this bill?" tone="danger" confirmLabel="Cancel bill" onConfirm={() => void send()} onCancel={() => setConfirming(false)}>
                <p>
                    Reverse bill <code>{billId}</code>
                    {redemptionId ? <> and redemption <code>{redemptionId}</code></> : null} on <strong>{tenant.name}</strong>.
                </p>
                <p>This changes the customer's real points balance and can't be undone.</p>
            </ConfirmDialog>
        </div>
    );
}
