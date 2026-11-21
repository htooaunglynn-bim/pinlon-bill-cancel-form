import { Link } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayIcon } from '@/components/ClayIcon';
import { HealthDot } from '@/components/TenantSwitcher';
import { PageHeader, Stat } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { whenText } from '@/lib/dates';
import { isToday, KIND_LABEL, useHistory } from '@/lib/history';

const ACTIONS = [
    { to: '/invoice', label: 'Print invoice QR', icon: 'preview', tone: 'bg-sun' },
    { to: '/onboarding', label: 'Onboarding QR', icon: 'staff', tone: 'bg-lav' },
    { to: '/mobile', label: 'Customer QR', icon: 'sparkles', tone: 'bg-lav' },
    { to: '/terminal/lookup', label: 'Scan customer', icon: 'staff', tone: 'bg-mint' },
    { to: '/terminal/points', label: 'Earn / Redeem', icon: 'earn', tone: 'bg-mint' },
    { to: '/terminal/bill-cancel', label: 'Cancel a bill', icon: 'error', tone: 'bg-pink' },
    { to: '/terminal/redemptions', label: 'Approve redemption', icon: 'coin', tone: 'bg-sun' },
];

export function OverviewPage() {
    const { tenants, tenant, setTenantKey, health, checkHealth } = useTenant();
    const history = useHistory();
    const today = history.filter((h) => isToday(h.at) && h.tenant === tenant.key);
    const count = (kinds: string[]) => today.filter((h) => kinds.includes(h.kind) && h.ok).length;

    return (
        <div className="space-y-7">
            <PageHeader title="Overview" subtitle={`POS activity from this browser for ${tenant.name}, today.`} />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Earns" value={count(['earn'])} tone="mint" />
                <Stat label="Redeems" value={count(['redeem', 'claim', 'reward-apply'])} tone="sun" />
                <Stat label="Bill cancels" value={count(['bill-cancel'])} tone="pink" />
                <Stat label="QRs generated" value={count(['qr-invoice', 'qr-onboarding', 'qr-link', 'qr-posscan'])} tone="lav" />
            </div>

            <ClayCard title="POS connection" icon="sparkles" tone="lav" delay={0.05}>
                <ul className="grid gap-3 md:grid-cols-2">
                    {tenants.map((t) => {
                        const h = health[t.key];
                        const active = t.key === tenant.key;
                        return (
                            <li key={t.key} className={`clay-inset rounded-blob px-4 py-3.5 ${active ? 'bg-lav/35' : 'bg-cream'}`}>
                                <div className="flex items-center gap-2.5">
                                    <HealthDot health={h} />
                                    <p className="flex-1 font-display font-semibold">{t.name}</p>
                                    {active ? <ClayChip>selected</ClayChip> : null}
                                </div>
                                <p className="mt-1 truncate font-mono text-xs text-clay-muted">{t.host}</p>
                                <p className="mt-1 text-sm text-clay-muted">
                                    {h?.state === 'ok'
                                        ? `Token valid · ${h.ms} ms · ${whenText(h.checkedAt)}`
                                        : h?.state === 'error'
                                          ? h.message
                                          : h?.state === 'checking'
                                            ? 'Checking…'
                                            : 'Not checked yet'}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <ClayButton tone="ghost" compact type="button" onClick={() => void checkHealth(t, true)}>Check</ClayButton>
                                    {!active ? (
                                        <ClayButton tone="ghost" compact type="button" onClick={() => setTenantKey(t.key)}>Select</ClayButton>
                                    ) : null}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </ClayCard>

            <ClayCard title="Quick actions" icon="coin" tone="sun" delay={0.1}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {ACTIONS.map((a) => (
                        <Link
                            key={a.to}
                            to={a.to}
                            className={`clay-pressable flex items-center gap-3 rounded-blob px-4 py-3.5 font-display text-[15px] font-semibold ${a.tone} focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep`}
                        >
                            <ClayIcon name={a.icon} size={30} />
                            {a.label}
                        </Link>
                    ))}
                </div>
            </ClayCard>

            <ClayCard
                title="Recent activity"
                icon="formulas"
                tone="mint"
                delay={0.15}
                actions={<Link to="/history" className="font-display text-sm font-semibold text-clay-ink underline underline-offset-2">View all</Link>}
            >
                {history.length === 0 ? (
                    <p className="text-clay-muted">Nothing yet. Generated QRs and POS calls will show up here.</p>
                ) : (
                    <ul className="space-y-2">
                        {history.slice(0, 10).map((h) => (
                            <li key={h.id} className="clay-inset flex flex-wrap items-center gap-x-3 gap-y-1 rounded-blob bg-cream px-4 py-2.5 text-sm">
                                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${h.ok ? 'bg-mint-deep' : 'bg-pink-deep'}`} />
                                <span className="font-display font-semibold">{KIND_LABEL[h.kind]}</span>
                                <span className="min-w-0 flex-1 truncate text-clay-muted">{h.summary}</span>
                                <span className="text-xs text-clay-muted">{whenText(h.at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </ClayCard>
        </div>
    );
}
