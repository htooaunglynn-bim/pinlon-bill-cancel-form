import { useState } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { HealthDot } from '@/components/TenantSwitcher';
import { FieldError, KeyValue, PageHeader } from '@/components/ui';
import { config, maskToken } from '@/config/env';
import { useTenant } from '@/context/TenantContext';
import { useStatus } from '@/hooks/useStatus';
import { DEFAULT_PREFS, type Prefs, setPrefs, usePrefs } from '@/lib/prefs';

const DOCS = [
    ['POS scan-first (lookup / process)', 'bim-lpms/docs/api-contract/pos-scan-pos.md'],
    ['Bill cancel', 'bim-lpms/docs/api-contract/pos-bill-cancel.md'],
    ['Point payment & reward callbacks', 'bim-lpms/docs/api-contract/point-payment-pos-callback.md'],
    ['Bill cancel spec', 'bim-lpms/docs/specs/pos-bill-cancel-refund-recharge-feature-spec.md'],
];

export function SettingsPage() {
    const prefs = usePrefs();
    const { tenants, tenant, health } = useTenant();
    const [draft, setDraft] = useState<Prefs>(prefs);
    const { status, say } = useStatus();

    const errors = {
        minimumInvoiceAmount: !(draft.minimumInvoiceAmount >= 0) ? 'Must be 0 or more.' : undefined,
        ageLimit: !(Number.isInteger(draft.ageLimit) && draft.ageLimit >= 0 && draft.ageLimit <= 120) ? 'Whole number 0–120.' : undefined,
        defaultLocationId: draft.defaultLocationId && !/^\d+$/.test(draft.defaultLocationId) ? 'Must be a number, or blank.' : undefined,
    };
    const valid = !Object.values(errors).some(Boolean);

    function save() {
        if (!valid) return;
        setPrefs(draft);
        say('Preferences saved in this browser.', 'success');
    }

    return (
        <div className="space-y-7">
            <PageHeader title="Settings" subtitle="Local preferences and the dashboard's environment configuration." />

            <ClayCard
                title="Hospital rules"
                icon="formulas"
                tone="lav"
                intro={<p>The public POS API doesn't expose these hospital settings, so set them here to match. They only drive warnings and validation in this dashboard; the server always has the final say.</p>}
            >
                <form className="grid gap-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
                    <ClayField label="Minimum invoice amount" hint="MMK (points.minimum_invoice_amount)" htmlFor="min">
                        <ClayInput id="min" type="number" min={0} value={draft.minimumInvoiceAmount} onChange={(e) => setDraft({ ...draft, minimumInvoiceAmount: Number(e.target.value) })} />
                        <FieldError>{errors.minimumInvoiceAmount}</FieldError>
                    </ClayField>
                    <ClayField label="Age limit" hint="years (customers.below_age_limit)" htmlFor="age">
                        <ClayInput id="age" type="number" min={0} max={120} value={draft.ageLimit} onChange={(e) => setDraft({ ...draft, ageLimit: Number(e.target.value) })} />
                        <FieldError>{errors.ageLimit}</FieldError>
                    </ClayField>
                    <ClayField label="Default location ID" hint="(optional, tenant_locations id)" htmlFor="loc">
                        <ClayInput id="loc" inputMode="numeric" value={draft.defaultLocationId} onChange={(e) => setDraft({ ...draft, defaultLocationId: e.target.value.trim() })} />
                        <FieldError>{errors.defaultLocationId}</FieldError>
                    </ClayField>
                    <div />
                    <ClayField label="Receipt header" htmlFor="rh">
                        <ClayInput id="rh" value={draft.receiptHeader} maxLength={60} onChange={(e) => setDraft({ ...draft, receiptHeader: e.target.value })} />
                    </ClayField>
                    <ClayField label="Receipt footer" htmlFor="rf">
                        <ClayInput id="rf" value={draft.receiptFooter} maxLength={120} onChange={(e) => setDraft({ ...draft, receiptFooter: e.target.value })} />
                    </ClayField>
                    <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                        <ClayButton type="submit" disabled={!valid} className="sm:w-auto sm:px-8">Save</ClayButton>
                        <ClayButton tone="ghost" type="button" className="sm:w-auto sm:px-8" onClick={() => setDraft(DEFAULT_PREFS)}>Reset to defaults</ClayButton>
                    </div>
                </form>
                <StatusMessage status={status} />
            </ClayCard>

            <ClayCard
                title="Environment"
                icon="sparkles"
                tone="sun"
                delay={0.05}
                intro={<p>Read-only. This session's tenant, slug and token come from the sign-in; they are managed in the central dashboard.</p>}
            >
                <KeyValue
                    rows={[
                        ['Tenant ID', tenant.key],
                        ['Slug', <code key="s">{tenant.slug}</code>],
                        ['Token', <code key="t">{maskToken(tenant.token)}</code>],
                        ['Session length', `${config.sessionHours} hours`],
                    ]}
                />
                <ul className="mt-5 space-y-2">
                    {tenants.map((t) => (
                        <li key={t.key} className="clay-inset flex items-center gap-3 rounded-blob bg-cream px-4 py-2.5 text-sm">
                            <HealthDot health={health[t.key]} />
                            <span className="font-display font-semibold">{t.name}</span>
                            <code className="ml-auto truncate text-xs text-clay-muted">{t.host}</code>
                        </li>
                    ))}
                </ul>
                <div className="clay-inset mt-5 rounded-blob bg-pink/20 px-4 py-3 text-sm">
                    <p className="font-semibold text-pink-deep">Security note</p>
                    <p className="mt-1 text-clay-ink">
                        The token you signed in with is held in this tab's session storage only and is cleared on sign-out. Rotate it in the central dashboard
                        (Tenants → LPMS integration) if it is ever exposed.
                    </p>
                </div>
            </ClayCard>

            <ClayCard title="API reference" icon="preview" tone="mint" delay={0.1}>
                <KeyValue
                    rows={[
                        ['Base path', <code key="b">/api/v1/public/{tenant.slug}</code>],
                        ['Auth', <code key="a">Authorization: Bearer &lt;tenant LPMS token&gt;</code>],
                        ['Rate limit', '120 requests/min for lookup, process and cancel. Shared by every caller using the token.'],
                        ['Time zone', 'Asia/Yangon. Bills can only be claimed or cancelled on the same day.'],
                    ]}
                />
                <ul className="mt-5 space-y-1.5 text-sm">
                    {DOCS.map(([label, path]) => (
                        <li key={path}>
                            <span className="font-semibold">{label}:</span> <code className="text-clay-muted">{path}</code>
                        </li>
                    ))}
                </ul>
            </ClayCard>
        </div>
    );
}
