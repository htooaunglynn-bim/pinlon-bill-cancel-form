import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ActiveQrBanner } from '@/components/ActiveQrBanner';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QrInput } from '@/components/QrInput';
import { StatusMessage } from '@/components/StatusMessage';
import { FieldError, JsonBlock, KeyValue, PageHeader, Segmented, Stat } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { usePosCall } from '@/hooks/usePosCall';
import { useSharedQrField } from '@/hooks/useSharedQrField';
import { posApi } from '@/lib/api';
import { formatMmk, formatPoints, whenText } from '@/lib/dates';
import { usePrefs } from '@/lib/prefs';
import { compact } from '@/lib/query';
import { newBid } from '@/lib/qr/invoice';
import type { ProcessPointsResult } from '@/lib/types';

type Type = 'earn' | 'redeem';

export function PointsPage() {
    const { tenant } = useTenant();
    const prefs = usePrefs();
    const [params] = useSearchParams();
    const [type, setType] = useState<Type>(params.get('type') === 'redeem' ? 'redeem' : 'earn');
    const { qr, setQr, expired: qrExpired, markUsed } = useSharedQrField(params.get('qr'));
    const [amount, setAmount] = useState(params.get('amount') ?? '');
    const [points, setPoints] = useState('');
    const [reference, setReference] = useState(params.get('reference') ?? newBid());
    const [reason, setReason] = useState('');
    const [locationId, setLocationId] = useState(prefs.defaultLocationId);
    const [confirming, setConfirming] = useState(false);
    const call = usePosCall<ProcessPointsResult>();

    const amountNum = Number(amount);
    const pointsNum = Number(points);
    const errors = {
        qr: qr.trim() ? undefined : 'Scan the customer QR first.',
        amount: type === 'earn' && !(amountNum >= 1 && amountNum <= 100_000_000) ? 'Amount must be between 1 and 100,000,000 MMK.' : undefined,
        points: type === 'redeem' && !(Number.isInteger(pointsNum) && pointsNum >= 1 && pointsNum <= 10_000_000) ? 'Points must be a whole number between 1 and 10,000,000.' : undefined,
        reference: !reference.trim() ? 'Reference is required.' : reference.length > 100 ? 'At most 100 characters.' : undefined,
        locationId: locationId && !/^\d+$/.test(locationId) ? 'Location ID must be a number.' : undefined,
    };
    const valid = !Object.values(errors).some(Boolean);
    const [submitted, setSubmitted] = useState(false);
    const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);

    function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitted(true);
        if (valid) setConfirming(true);
    }

    async function send() {
        setConfirming(false);
        const body = compact({
            qr_content: qr,
            type,
            amount: type === 'earn' ? amountNum : undefined,
            points: type === 'redeem' ? pointsNum : undefined,
            reference,
            reason,
            location_id: locationId ? Number(locationId) : undefined,
        });
        const summary = type === 'earn' ? `Earn on ${formatMmk(amountNum)} · ref ${reference}` : `Redeem ${pointsNum} pts · ref ${reference}`;
        const result = await call.run(
            () => posApi<ProcessPointsResult>(tenant, '/points/process', { method: 'POST', json: body, log: { kind: type, summary, meta: { reference } } }),
            (d) => (type === 'earn' ? `Earned ${formatPoints(d.transaction.point_earn)} points.` : `Redeemed ${formatPoints(d.transaction.point_deducted)} points.`) + ` New balance: ${formatPoints(d.points_balance)}.`,
        );
        // The customer QR is used up by a successful earn/redeem.
        if (result.ok) markUsed();
    }

    function nextBill() {
        setReference(newBid());
        setAmount('');
        setPoints('');
        setReason('');
        setSubmitted(false);
        call.reset();
    }

    const t = call.data?.transaction;

    return (
        <div className="space-y-7">
            <PageHeader title="Earn / Redeem" subtitle="Add points for a bill, or spend points as a discount (1 point = 1 MMK).">
                <Segmented
                    label="Transaction type"
                    value={type}
                    onChange={(v) => { setType(v); call.reset(); }}
                    options={[
                        { value: 'earn', label: 'Earn' },
                        { value: 'redeem', label: 'Redeem' },
                    ]}
                />
            </PageHeader>

            <ClayCard
                title={type === 'earn' ? 'Earn points' : 'Redeem points'}
                icon={type === 'earn' ? 'earn' : 'coin'}
                tone={type === 'earn' ? 'mint' : 'sun'}
                intro={
                    <p>
                        The <strong>reference</strong> is the POS bill number and makes the call safe to repeat: sending the same reference again returns the
                        original transaction instead of charging twice. Use the same reference later to cancel the bill.
                    </p>
                }
            >
                <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" noValidate>
                    <ClayField label="Customer QR" htmlFor="qr" className="sm:col-span-2">
                        <ActiveQrBanner value={qr} onUse={setQr} onDismiss={() => setQr('')} expired={qrExpired} />
                        <QrInput id="qr" value={qr} onChange={setQr} placeholder="POSSCAN…" invalid={!!show('qr')} />
                        <FieldError>{show('qr')}</FieldError>
                        <p className="mt-1.5 text-sm text-clay-muted">
                            {qr.trim() ? (
                                <>Not sure who it is? <Link to={`/terminal/lookup?qr=${encodeURIComponent(qr)}`} className="font-semibold text-lav-deep underline">Look up first</Link>.</>
                            ) : (
                                <>No QR? <Link to="/mobile" className="font-semibold text-lav-deep underline">Get one from the customer app →</Link></>
                            )}
                        </p>
                    </ClayField>

                    {type === 'earn' ? (
                        <ClayField label="Bill amount" hint="MMK" htmlFor="amount">
                            <ClayInput id="amount" type="number" inputMode="decimal" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25000" aria-invalid={!!show('amount')} />
                            <FieldError>{show('amount')}</FieldError>
                            {amountNum > 0 && amountNum < prefs.minimumInvoiceAmount ? (
                                <p className="mt-1.5 text-sm text-clay-muted">⚠ Below the minimum invoice amount ({prefs.minimumInvoiceAmount.toLocaleString()} MMK). The server may reject it with EARN_BELOW_MINIMUM.</p>
                            ) : null}
                        </ClayField>
                    ) : (
                        <ClayField label="Points to redeem" htmlFor="points">
                            <ClayInput id="points" type="number" inputMode="numeric" min={1} step={1} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="1000" aria-invalid={!!show('points')} />
                            <FieldError>{show('points')}</FieldError>
                            {pointsNum > 0 ? <p className="mt-1.5 text-sm text-clay-muted">Discount: {formatMmk(pointsNum)}</p> : null}
                        </ClayField>
                    )}

                    <ClayField label="Reference" hint="bill number" htmlFor="reference">
                        <div className="flex gap-2">
                            <ClayInput id="reference" mono value={reference} onChange={(e) => setReference(e.target.value)} aria-invalid={!!show('reference')} />
                            <ClayButton tone="ghost" compact type="button" onClick={() => setReference(newBid())} aria-label="Generate new reference" className="shrink-0">↻</ClayButton>
                        </div>
                        <FieldError>{show('reference')}</FieldError>
                    </ClayField>

                    <ClayField label="Location ID" hint="(optional)" htmlFor="location">
                        <ClayInput id="location" inputMode="numeric" value={locationId} onChange={(e) => setLocationId(e.target.value.trim())} placeholder="e.g. 1" aria-invalid={!!show('locationId')} />
                        <FieldError>{show('locationId')}</FieldError>
                    </ClayField>

                    <ClayField label="Reason / note" hint="(optional)" htmlFor="reason">
                        <ClayInput id="reason" value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
                    </ClayField>

                    <div className="sm:col-span-2">
                        <ClayButton type="submit" tone={type === 'earn' ? 'primary' : 'secondary'} disabled={call.busy}>
                            {call.busy ? 'Sending…' : type === 'earn' ? 'Earn points' : 'Redeem points'}
                        </ClayButton>
                    </div>
                </form>
                <StatusMessage status={call.status} />
            </ClayCard>

            {t && call.data ? (
                <ClayCard title="Transaction" icon="success" tone="lav" delay={0.05}>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Stat label={type === 'earn' ? 'Points earned' : 'Points redeemed'} value={formatPoints(type === 'earn' ? t.point_earn : t.point_deducted)} tone={type === 'earn' ? 'mint' : 'sun'} />
                        <Stat label="New balance" value={formatPoints(call.data.points_balance)} tone="lav" />
                        <Stat label="Status" value={t.status ?? 'done'} tone="mint" />
                    </div>
                    <div className="mt-6">
                        <KeyValue
                            rows={[
                                ['Transaction', <code key="u">{t.uuid}</code>],
                                ['Reference', <code key="r">{reference}</code>],
                                ['Amount', t.amount_mmk !== null ? formatMmk(t.amount_mmk) : '-'],
                                ['Description', t.description_en],
                                ['Expires', whenText(t.expires_at)],
                                ['Created', whenText(t.created_at)],
                            ]}
                        />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <ClayButton tone="ghost" compact type="button" onClick={nextBill}>Next bill</ClayButton>
                        <Link
                            to={`/terminal/bill-cancel?bill=${encodeURIComponent(type === 'earn' ? reference : '')}${type === 'redeem' ? `&redemption=${encodeURIComponent(reference)}` : ''}`}
                            className="clay-pressable rounded-blob bg-pink px-4 py-2 font-display text-sm font-semibold focus-visible:outline-3 focus-visible:outline-lav-deep"
                        >
                            Cancel this bill…
                        </Link>
                    </div>
                    <div className="mt-5">
                        <JsonBlock value={call.data} label="Raw response" />
                    </div>
                </ClayCard>
            ) : null}

            <ConfirmDialog
                open={confirming}
                title={type === 'earn' ? 'Earn points?' : 'Redeem points?'}
                confirmLabel={type === 'earn' ? 'Earn' : 'Redeem'}
                onConfirm={() => void send()}
                onCancel={() => setConfirming(false)}
            >
                <p>
                    {type === 'earn' ? <>Earn points on a bill of <strong>{formatMmk(amountNum)}</strong></> : <>Redeem <strong>{pointsNum.toLocaleString()} points</strong> ({formatMmk(pointsNum)} discount)</>}{' '}
                    on <strong>{tenant.name}</strong>, reference <code>{reference}</code>.
                </p>
                <p>This changes the customer's real points balance.</p>
            </ConfirmDialog>
        </div>
    );
}
