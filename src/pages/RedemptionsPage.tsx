import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QrInput } from '@/components/QrInput';
import { StatusMessage } from '@/components/StatusMessage';
import { FieldWarning, JsonBlock, KeyValue, PageHeader, Segmented } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { usePosCall } from '@/hooks/usePosCall';
import { posApi } from '@/lib/api';
import { formatPoints, whenText } from '@/lib/dates';
import { usePrefs } from '@/lib/prefs';
import { parseRedemptionQr } from '@/lib/qr/scan';
import type { RedemptionCallbackResult } from '@/lib/types';

type Kind = 'CLAIM' | 'REWARD';

const STATE_TEXT: Record<string, string> = {
    deducted: 'Points deducted. Redemption complete.',
    expired: 'The redemption QR expired before it was claimed.',
    retry_pending: 'Recorded a failed attempt. The customer can try again.',
    cancelled: 'Cancelled after too many failed attempts.',
    insufficient_balance: 'The customer no longer has enough points.',
};

export function RedemptionsPage() {
    const { tenant } = useTenant();
    const prefs = usePrefs();
    const [params] = useSearchParams();
    // Prefilled when coming from the Rewards page ("Use at POS").
    const [qr, setQr] = useState(params.get('qr') ?? '');
    const fromRewards = params.get('from') === 'rewards';
    const [kindOverride, setKindOverride] = useState<Kind>('REWARD');
    const [locationId, setLocationId] = useState(prefs.defaultLocationId);
    const [pending, setPending] = useState<boolean | null>(null);
    const call = usePosCall<RedemptionCallbackResult>();

    const parsed = qr.trim() ? parseRedemptionQr(qr) : null;
    const full = parsed && 'type' in parsed ? parsed : null;
    const uuid = parsed ? ('type' in parsed ? parsed.uuid : parsed.uuidOnly) : null;
    const kind: Kind = full?.type ?? kindOverride;
    const path = kind === 'CLAIM' ? '/point-payments/claim' : '/reward-discounts/apply';

    async function send(status: boolean) {
        setPending(null);
        if (!uuid) return;
        await call.run(
            () => posApi<RedemptionCallbackResult>(tenant, path, {
                query: { redemption_uuid: uuid, status: status ? 'true' : 'false', location_id: locationId },
                log: {
                    kind: kind === 'CLAIM' ? 'claim' : 'reward-apply',
                    summary: `${status ? 'Approve' : 'Decline'} ${kind === 'CLAIM' ? 'point payment' : 'reward'} ${uuid.slice(0, 8)}…`,
                    meta: { uuid },
                },
            }),
            (d) => STATE_TEXT[d.callback_state ?? ''] ?? `Done (${d.callback_state ?? d.status ?? 'ok'}).`,
        );
    }

    const d = call.data;

    return (
        <div className="space-y-7">
            <PageHeader title="Redemptions" subtitle="Approve or decline a customer's redemption QR: point payments (CLAIM) or catalog rewards (REWARD)." />

            <ClayCard
                title="Scan redemption QR"
                icon="coin"
                tone="sun"
                intro={<p>Point-payment QRs are valid for 5 minutes and reward QRs for 48 hours. Approve after the sale goes through; decline if payment failed so the customer can retry.</p>}
            >
                <div className="space-y-5">
                    <ClayField label="QR content or redemption UUID" htmlFor="qr">
                        <QrInput id="qr" value={qr} onChange={(v) => { setQr(v); call.reset(); }} placeholder="REWARD,6f1c…,M000123,10,PERCENTAGE,21 NOV 2026" />
                        {qr.trim() && !parsed ? <FieldWarning>Not a redemption QR. Expected TYPE,UUID,MEMBER,AMOUNT,AMOUNT_TYPE,DATE or a bare UUID.</FieldWarning> : null}
                    </ClayField>

                    {full ? (
                        <div className="clay-inset rounded-blob bg-cream px-5 py-4">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <ClayChip className={full.type === 'CLAIM' ? '!bg-mint/50' : '!bg-lav/50'}>{full.type === 'CLAIM' ? 'Point payment' : 'Reward'}</ClayChip>
                                <ClayChip>{full.memberCode}</ClayChip>
                            </div>
                            <KeyValue
                                rows={[
                                    ['Redemption', <code key="u">{full.uuid}</code>],
                                    ['Value', `${full.amount} ${full.amountType}`],
                                    ['Issued', full.date],
                                ]}
                            />
                        </div>
                    ) : uuid ? (
                        <div>
                            <p className="mb-2 font-display text-[15px] font-semibold">Bare UUID: which kind is it?</p>
                            <Segmented
                                label="Redemption kind"
                                value={kindOverride}
                                onChange={setKindOverride}
                                options={[
                                    { value: 'REWARD', label: 'Reward' },
                                    { value: 'CLAIM', label: 'Point payment' },
                                ]}
                            />
                        </div>
                    ) : null}

                    <ClayField label="Location ID" hint="(optional)" htmlFor="location" className="max-w-xs">
                        <ClayInput id="location" inputMode="numeric" value={locationId} onChange={(e) => setLocationId(e.target.value.replace(/\D/g, ''))} />
                    </ClayField>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <ClayButton type="button" disabled={!uuid || call.busy} onClick={() => setPending(true)}>Approve</ClayButton>
                        <ClayButton tone="danger" type="button" disabled={!uuid || call.busy} onClick={() => setPending(false)}>Decline</ClayButton>
                    </div>
                </div>
                <StatusMessage status={call.status} />
                {fromRewards && call.data ? (
                    <p className="mt-3 text-sm">
                        <Link to="/mobile/rewards" className="font-semibold text-lav-deep underline">← Back to the customer's rewards</Link>
                    </p>
                ) : null}
            </ClayCard>

            {d ? (
                <ClayCard title="Result" icon="success" tone="mint" delay={0.05} actions={d.callback_state ? <ClayChip>{d.callback_state}</ClayChip> : null}>
                    <KeyValue
                        rows={[
                            ['Customer', d.customer_name],
                            ['Redemption', <code key="u">{d.redemption_uuid}</code>],
                            ['Status', d.status],
                            ...(d.reward_name_en ? ([['Reward', `${d.reward_name_en}${d.discount !== undefined ? ` · discount ${d.discount}` : ''}`], ['Stock remaining', d.stock_remaining ?? '-']] as [string, ReactNode][]) : []),
                            ...(d.points_spent !== undefined ? ([['Points spent', formatPoints(d.points_spent)], ['Balance after', formatPoints(d.points_balance_after)]] as [string, ReactNode][]) : []),
                            ['Validated', whenText(d.validated_at)],
                            ['Attempts', `${d.callback_attempts ?? 0} (${d.callback_failed_attempts ?? 0} failed)`],
                        ]}
                    />
                    <div className="mt-5">
                        <JsonBlock value={d} label="Raw response" />
                    </div>
                </ClayCard>
            ) : null}

            <ConfirmDialog
                open={pending !== null}
                title={pending ? 'Approve redemption?' : 'Decline redemption?'}
                tone={pending ? 'primary' : 'danger'}
                confirmLabel={pending ? 'Approve' : 'Decline'}
                onConfirm={() => void send(pending === true)}
                onCancel={() => setPending(null)}
            >
                {pending ? (
                    <p>{kind === 'CLAIM' ? 'Deduct the points from the customer' : 'Mark the reward as used and reduce stock'} on <strong>{tenant.name}</strong>.</p>
                ) : (
                    <p>Record a failed attempt. After 10 failures the redemption is cancelled automatically.</p>
                )}
            </ConfirmDialog>
        </div>
    );
}
