import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayInput } from '@/components/ClayInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QrPreview } from '@/components/QrPreview';
import { StatusMessage } from '@/components/StatusMessage';
import { PageHeader, Segmented, Stat } from '@/components/ui';
import { useCustomerSession, type CustomerSession } from '@/context/CustomerSessionContext';
import { useTenant } from '@/context/TenantContext';
import { useCountdown } from '@/hooks/useCountdown';
import { usePosCall } from '@/hooks/usePosCall';
import { useStatus } from '@/hooks/useStatus';
import { customerApi } from '@/lib/api';
import { formatPoints, whenText } from '@/lib/dates';
import { failText, hintFor } from '@/lib/errors';
import { readSession, writeSession } from '@/lib/storage';
import type { CustomerProfile, Reward, RewardQrResult, RewardRedemption } from '@/lib/types';

// The customer app's Rewards tab: browse the catalog, redeem a reward (creates a pending
// redemption with a 48-hour REWARD QR), then use it at the POS. Points and stock are only
// deducted when the POS approves the QR (GET /public/pos/reward-discounts/apply).
//
// The customer redemptions list endpoint is disabled on the server, so redemptions made here
// are remembered per hospital + customer in sessionStorage and refreshed via /rewards/{uuid}/status.

type SavedRedemption = {
    uuid: string;
    rewardName: string;
    points: number;
    qr: string | null;
    expiresAt: string | null;
    status: string;
    createdAt: string;
};

const savedKey = (tenantKey: string, memberCode: string) => `rewardRedemptions:${tenantKey}:${memberCode}`;

function rowsOf<T>(data: T[] | { data: T[] } | undefined): T[] {
    return Array.isArray(data) ? data : data?.data ?? [];
}

export function RewardsPage() {
    const { session } = useCustomerSession();

    return (
        <div className="space-y-7">
            <PageHeader title="Rewards" subtitle="The customer's Rewards tab: redeem a reward to get its QR, then use it at the POS." />
            {session ? (
                <RewardsForCustomer session={session} />
            ) : (
                <ClayCard title="No customer signed in" icon="staff" tone="lav">
                    <p className="text-[15px] text-clay-muted">
                        Rewards belong to a customer. <Link to="/mobile" className="font-semibold text-lav-deep underline">Sign in a customer on Customer app</Link> first.
                    </p>
                </ClayCard>
            )}
        </div>
    );
}

function RewardsForCustomer({ session }: { session: CustomerSession }) {
    const { tenant } = useTenant();
    const { forget, updateProfile } = useCustomerSession();
    const navigate = useNavigate();
    const c = session.profile;
    const balance = Number(c.points_balance) || 0;
    const key = savedKey(tenant.key, c.member_code);

    const [tab, setTab] = useState<'catalog' | 'mine'>('catalog');
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const list = useStatus();
    const [saved, setSaved] = useState<SavedRedemption[]>(() => readSession<SavedRedemption[]>(key, []));
    const [confirm, setConfirm] = useState<Reward | null>(null);
    const redeem = usePosCall<RewardRedemption>('customer');
    const [justRedeemed, setJustRedeemed] = useState<string | null>(null);

    const persist = useCallback((next: SavedRedemption[]) => {
        setSaved(next);
        writeSession(key, next);
    }, [key]);

    useEffect(() => setSaved(readSession<SavedRedemption[]>(key, [])), [key]);

    const handle401 = useCallback((status: number) => {
        if (status === 401) forget();
        return status === 401;
    }, [forget]);

    const loadRewards = useCallback(async () => {
        setLoading(true);
        const r = await customerApi<Reward[] | { data: Reward[] }>(tenant, '/rewards', { query: { per_page: 100 }, token: session.token });
        setLoading(false);
        if (handle401(r.status)) return;
        if (!r.ok) {
            list.say(failText(r, 'Could not load rewards.'), 'error', [hintFor(r, 'customer') ?? '']);
            return;
        }
        list.clear();
        setRewards(rowsOf(r.payload.data));
    }, [tenant, session.token, handle401, list.say, list.clear]);

    const refreshProfile = useCallback(async () => {
        const r = await customerApi<CustomerProfile>(tenant, '/me', { token: session.token });
        if (!handle401(r.status) && r.ok && r.payload.data) updateProfile(r.payload.data);
    }, [tenant, session.token, handle401, updateProfile]);

    useEffect(() => {
        void loadRewards();
        void refreshProfile();
    }, [loadRewards, refreshProfile]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? rewards.filter((r) => `${r.name_en} ${r.name_my ?? ''} ${r.reward_id ?? ''}`.toLowerCase().includes(q)) : rewards;
    }, [rewards, search]);

    async function doRedeem(reward: Reward) {
        setConfirm(null);
        const result = await redeem.run(
            () => customerApi<RewardRedemption>(tenant, `/rewards/${reward.id}/redeem`, {
                method: 'POST',
                token: session.token,
                log: { kind: 'reward-redeem', summary: `${c.name} redeemed ${reward.name_en} (${reward.points_required} pts)`, meta: { member: c.member_code, reward: String(reward.id) } },
            }),
            () => `Redeemed ${reward.name_en}. Show the QR at the POS within 48 hours.`,
        );
        if (handle401(result.status)) return;
        const red = result.payload.data;
        if (!result.ok || !red) return;

        // Fetch the scannable QR string for the new redemption.
        const qr = await customerApi<RewardQrResult>(tenant, `/rewards/${red.uuid}/qr`, { token: session.token });
        const entry: SavedRedemption = {
            uuid: red.uuid,
            rewardName: red.reward?.name_en ?? reward.name_en,
            points: Number(red.points_spent ?? reward.points_required),
            qr: qr.ok ? qr.payload.data?.qr_string ?? null : null,
            expiresAt: (qr.ok ? qr.payload.data?.qr_expires_at : null) ?? red.qr_expires_at,
            status: red.status,
            createdAt: red.created_at ?? new Date().toISOString(),
        };
        persist([entry, ...saved.filter((s) => s.uuid !== entry.uuid)]);
        setJustRedeemed(entry.uuid);
        setTab('mine');
    }

    const pendingCount = saved.filter((s) => s.status === 'pending').length;

    return (
        <>
            <ClayCard title={c.name} icon="success" tone="mint" actions={<ClayChip>{c.member_code}</ClayChip>}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat label="Points" value={formatPoints(balance)} tone="mint" />
                    <Stat label="Tier" value={c.tier?.name_en ?? c.tier?.name ?? 'None'} tone="lav" />
                    <Stat label="Unused reward QRs" value={pendingCount} tone="sun" />
                </div>
            </ClayCard>

            <Segmented
                label="Rewards view"
                value={tab}
                onChange={setTab}
                options={[
                    { value: 'catalog', label: 'Catalog' },
                    { value: 'mine', label: `My reward QRs${saved.length ? ` (${saved.length})` : ''}` },
                ]}
            />

            {tab === 'catalog' ? (
                <ClayCard
                    title="Available rewards"
                    icon="coin"
                    tone="sun"
                    delay={0.05}
                    intro={<p>Only rewards this customer's tier can redeem are listed. Redeeming reserves the reward; points are taken when the POS approves it.</p>}
                    actions={<ClayButton tone="ghost" compact type="button" onClick={() => void loadRewards()} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</ClayButton>}
                >
                    <ClayInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rewards…" aria-label="Search rewards" className="mb-5" />
                    <StatusMessage status={list.status} />
                    <StatusMessage status={redeem.status} />

                    {shown.length === 0 ? (
                        <p className="text-[15px] text-clay-muted">{loading ? 'Loading rewards…' : 'No rewards available for this customer.'}</p>
                    ) : (
                        <ul className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {shown.map((r) => {
                                const short = Math.max(0, r.points_required - balance);
                                const outOfStock = r.stock_quantity !== null && r.stock_quantity <= 0;
                                return (
                                    <li key={r.id} className="clay-inset flex flex-col overflow-hidden rounded-blob bg-cream">
                                        {r.image_url ? (
                                            <img src={r.image_url} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                                        ) : (
                                            <div aria-hidden="true" className="flex aspect-[16/9] items-center justify-center bg-sun/40 font-display text-3xl">🎁</div>
                                        )}
                                        <div className="flex flex-1 flex-col gap-2 p-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {r.category?.name_en || r.category?.name ? <ClayChip>{r.category?.name_en ?? r.category?.name}</ClayChip> : null}
                                                {r.is_baby ? <ClayChip className="!bg-pink/30">Baby</ClayChip> : null}
                                                {r.tiers?.length ? <ClayChip className="!bg-lav/40">{r.tiers.map((t) => t.name_en).join(', ')}</ClayChip> : null}
                                            </div>
                                            <h3 className="font-display text-[17px] font-semibold leading-snug">{r.name_en}</h3>
                                            {r.description_en ? <p className="line-clamp-2 text-sm text-clay-muted">{r.description_en}</p> : null}
                                            <p className="text-xs text-clay-muted">
                                                {r.stock_quantity === null ? 'Unlimited stock' : `${r.stock_quantity} left`}
                                                {r.valid_until ? ` · until ${r.valid_until}` : ''}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                                                <span className="font-display text-lg font-bold">{formatPoints(r.points_required)} pts</span>
                                                <ClayButton compact type="button" disabled={redeem.busy || outOfStock || short > 0} onClick={() => setConfirm(r)}>
                                                    {outOfStock ? 'Out of stock' : short > 0 ? `Need ${formatPoints(short)}` : 'Redeem'}
                                                </ClayButton>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </ClayCard>
            ) : (
                <ClayCard
                    title="My reward QRs"
                    icon="preview"
                    tone="lav"
                    delay={0.05}
                    intro={<p>Rewards redeemed from this dashboard for {c.name}. Use one at the POS before its QR expires; it can be used once.</p>}
                >
                    {saved.length === 0 ? (
                        <p className="text-[15px] text-clay-muted">
                            Nothing redeemed yet. <button type="button" onClick={() => setTab('catalog')} className="cursor-pointer font-semibold text-lav-deep underline">Browse the catalog</button>.
                        </p>
                    ) : (
                        <ul className="space-y-5">
                            {saved.map((s) => (
                                <SavedRedemptionRow
                                    key={s.uuid}
                                    item={s}
                                    highlight={s.uuid === justRedeemed}
                                    token={session.token}
                                    onUpdate={(next) => persist(saved.map((x) => (x.uuid === next.uuid ? next : x)))}
                                    onRemove={() => persist(saved.filter((x) => x.uuid !== s.uuid))}
                                    onUse={(qr) => navigate(`/terminal/redemptions?from=rewards&qr=${encodeURIComponent(qr)}`)}
                                    onUnauthorized={handle401}
                                    onUsed={() => void refreshProfile()}
                                />
                            ))}
                        </ul>
                    )}
                </ClayCard>
            )}

            <ConfirmDialog
                open={confirm !== null}
                title="Redeem this reward?"
                confirmLabel="Redeem"
                onConfirm={() => confirm && void doRedeem(confirm)}
                onCancel={() => setConfirm(null)}
            >
                <p>
                    Redeem <strong>{confirm?.name_en}</strong> for <strong>{formatPoints(confirm?.points_required ?? 0)} points</strong> as {c.name}.
                </p>
                <p>This creates a reward QR valid for 48 hours. Points are deducted when the POS approves it.</p>
            </ConfirmDialog>
        </>
    );
}

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
    pending: { label: 'Ready to use', className: '!bg-mint/50' },
    validated: { label: 'Used', className: '!bg-lav/40' },
    expired: { label: 'Expired', className: '!bg-pink/40' },
    cancelled: { label: 'Cancelled', className: '!bg-pink/40' },
};

function SavedRedemptionRow({
    item,
    highlight,
    token,
    onUpdate,
    onRemove,
    onUse,
    onUnauthorized,
    onUsed,
}: {
    item: SavedRedemption;
    highlight: boolean;
    token: string;
    onUpdate: (next: SavedRedemption) => void;
    onRemove: () => void;
    onUse: (qr: string) => void;
    onUnauthorized: (status: number) => boolean;
    onUsed: () => void;
}) {
    const { tenant } = useTenant();
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(highlight);
    const left = useCountdown(item.expiresAt ? new Date(item.expiresAt).getTime() : null);
    const status = item.status === 'pending' && item.expiresAt && left === 0 ? 'expired' : item.status;
    const chip = STATUS_CHIP[status] ?? { label: status, className: '' };

    const refresh = useCallback(async () => {
        setBusy(true);
        const r = await customerApi<RewardRedemption>(tenant, `/rewards/${item.uuid}/status`, { token });
        let next = item;
        if (!onUnauthorized(r.status) && r.ok && r.payload.data) {
            next = { ...item, status: r.payload.data.status, expiresAt: r.payload.data.qr_expires_at ?? item.expiresAt };
            // Older entries (or a failed first fetch) may lack the QR string.
            if (next.status === 'pending' && !next.qr) {
                const q = await customerApi<RewardQrResult>(tenant, `/rewards/${item.uuid}/qr`, { token });
                if (q.ok && q.payload.data?.qr_string) next = { ...next, qr: q.payload.data.qr_string };
            }
            if (next.status === 'validated' && item.status !== 'validated') onUsed();
            onUpdate(next);
        }
        setBusy(false);
    }, [tenant, item, token, onUpdate, onUnauthorized, onUsed]);

    // Check the live status once when the row mounts.
    useEffect(() => {
        void refresh();
    }, [item.uuid]);

    const hours = Math.floor(left / 3600);
    const mins = Math.floor((left % 3600) / 60);

    return (
        <li className={`clay-inset rounded-blob px-4 py-4 ${highlight ? 'bg-mint/20' : 'bg-cream'}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1 basis-52">
                    <p className="font-display font-semibold">{item.rewardName}</p>
                    <p className="text-xs text-clay-muted">
                        {formatPoints(item.points)} pts · redeemed {whenText(item.createdAt)}
                        {status === 'pending' && item.expiresAt ? ` · ${hours}h ${mins}m left` : ''}
                    </p>
                </div>
                <ClayChip className={chip.className}>{chip.label}</ClayChip>
            </div>

            <div className="mt-3 flex flex-wrap gap-2.5">
                {status === 'pending' && item.qr ? (
                    <>
                        <ClayButton compact type="button" onClick={() => onUse(item.qr as string)}>Use at POS →</ClayButton>
                        <ClayButton tone="ghost" compact type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Hide QR' : 'Show QR'}</ClayButton>
                    </>
                ) : null}
                <ClayButton tone="ghost" compact type="button" onClick={() => void refresh()} disabled={busy}>{busy ? 'Checking…' : 'Check status'}</ClayButton>
                {status !== 'pending' ? <ClayButton tone="ghost" compact type="button" onClick={onRemove}>Remove</ClayButton> : null}
            </div>

            {open && status === 'pending' && item.qr ? (
                <div className="mt-4">
                    <QrPreview value={item.qr} size={200} filename={`reward-${item.uuid.slice(0, 8)}`} />
                </div>
            ) : null}
        </li>
    );
}
