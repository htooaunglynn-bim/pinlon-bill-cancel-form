import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { QrInput } from '@/components/QrInput';
import { StatusMessage } from '@/components/StatusMessage';
import { FieldWarning, JsonBlock, KeyValue, PageHeader, Stat } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { usePosCall } from '@/hooks/usePosCall';
import { posApi } from '@/lib/api';
import { formatPoints, whenText } from '@/lib/dates';
import { parsePosScanQr } from '@/lib/qr/scan';
import type { CustomerLookup } from '@/lib/types';

export function LookupPage() {
    const { tenant } = useTenant();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [qr, setQr] = useState(params.get('qr') ?? '');
    const [amount, setAmount] = useState('');
    const call = usePosCall<CustomerLookup>();
    const parsed = qr.trim() ? parsePosScanQr(qr) : null;

    async function submit(e: FormEvent) {
        e.preventDefault();
        await call.run(
            () => posApi<CustomerLookup>(tenant, '/customers/lookup', {
                query: { qr_content: qr.trim() },
                log: { kind: 'lookup', summary: `Lookup ${parsed?.token.slice(0, 10) ?? qr.slice(0, 16)}…`, meta: { qr: qr.trim() } },
            }),
            (d) => `Found ${d.name} (${d.member_code}).`,
        );
    }

    const c = call.data;
    const multiplier = c?.tier?.points_multiplier ?? 0;
    const preview = amount && c ? Math.floor((Number(amount) * multiplier) / 100) : null;
    const go = (type: 'earn' | 'redeem') => navigate(`/terminal/points?type=${type}&qr=${encodeURIComponent(qr.trim())}${type === 'earn' && amount ? `&amount=${amount}` : ''}`);

    return (
        <div className="space-y-7">
            <PageHeader title="Customer lookup" subtitle="Scan the customer's in-app POS QR to see who they are before earning or redeeming." />

            <ClayCard
                title="Scan customer QR"
                icon="staff"
                tone="lav"
                intro={<p>The QR comes from <strong>Pay at POS</strong> in the Pinlon app. It is valid for 5 minutes and is used up by the first earn or redeem. Lookups don't use it up.</p>}
            >
                <form onSubmit={submit} className="space-y-4">
                    <ClayField label="QR content" htmlFor="qr">
                        <QrInput id="qr" value={qr} onChange={setQr} placeholder="POSSCAN…PS0123…" />
                        {!qr.trim() ? (
                            <p className="mt-1.5 text-sm text-clay-muted">
                                No QR? <Link to="/mobile" className="font-semibold text-lav-deep underline">Get one from the customer app →</Link>
                            </p>
                        ) : null}
                        {qr.trim() && !parsed ? <FieldWarning>This doesn't look like a POSSCAN customer QR. The server will probably reject it.</FieldWarning> : null}
                        {parsed?.legacy ? <FieldWarning>Legacy QR format. Still accepted, but ask the customer to update the app.</FieldWarning> : null}
                    </ClayField>
                    <ClayButton type="submit" disabled={!qr.trim() || call.busy}>{call.busy ? 'Looking up…' : 'Look up customer'}</ClayButton>
                </form>
                <StatusMessage status={call.status} />
            </ClayCard>

            {c ? (
                <ClayCard title={c.name} icon="success" tone="mint" delay={0.05} actions={<ClayChip>{c.member_code}</ClayChip>}>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Stat label="Points balance" value={formatPoints(c.points_balance)} tone="mint" />
                        <Stat label="Tier" value={c.tier?.name_en ?? 'None'} tone="lav" />
                        <Stat label="Multiplier" value={c.tier ? `×${c.tier.points_multiplier}` : '-'} tone="sun" />
                    </div>

                    <div className="mt-6">
                        <KeyValue
                            rows={[
                                ['Father name', c.father_name],
                                ['Phone', c.phone],
                                ['Email', c.email],
                                ['Date of birth', c.date_of_birth],
                                ['Gender', c.gender],
                                ['Registered', whenText(c.registered_at)],
                                ['Tier range', c.tier ? `${c.tier.min_points.toLocaleString()} – ${c.tier.max_points.toLocaleString()} pts` : '-'],
                                ['Earn formula', <code key="e">{c.point_increase_formular}</code>],
                                ['Redeem rate', <code key="r">{c.point_decrease_formular} (1 point = 1 MMK)</code>],
                            ]}
                        />
                    </div>

                    <div className="clay-inset mt-6 rounded-blob bg-cream px-5 py-4">
                        <ClayField label="Points preview" hint="bill amount in MMK" htmlFor="preview-amount">
                            <ClayInput id="preview-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25000" />
                        </ClayField>
                        {preview !== null ? (
                            <p className="mt-2 font-display font-semibold">
                                ≈ {preview.toLocaleString()} points <span className="font-sans text-sm font-normal text-clay-muted">(before the minimum invoice amount and department formulas)</span>
                            </p>
                        ) : null}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <ClayButton type="button" onClick={() => go('earn')}>Earn points →</ClayButton>
                        <ClayButton tone="secondary" type="button" onClick={() => go('redeem')}>Redeem points →</ClayButton>
                    </div>

                    <div className="mt-5">
                        <JsonBlock value={c} label="Raw response" />
                    </div>
                </ClayCard>
            ) : null}
        </div>
    );
}
