import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ClayBlobs } from '@/components/ClayBlobs';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayField } from '@/components/ClayField';
import { ClayIcon } from '@/components/ClayIcon';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { useAuth } from '@/context/AuthContext';
import { useStatus } from '@/hooks/useStatus';

export function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { status, say } = useStatus();
    const [tenantId, setTenantId] = useState('');
    const [slug, setSlug] = useState('');
    const [token, setToken] = useState('');
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);

    const from = (location.state as { from?: string } | null)?.from ?? '/';
    if (user) return <Navigate to={from} replace />;

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (busy) return;
        // The button stays enabled so an empty submit explains itself instead of doing nothing.
        if (!tenantId.trim() || !slug.trim() || !token.trim()) {
            say(!tenantId.trim() ? 'Enter the tenant ID.' : !slug.trim() ? 'Enter the slug.' : 'Enter the token.', 'error');
            return;
        }
        setBusy(true);
        const result = await login(tenantId, slug, token);
        setBusy(false);
        if (result.ok) {
            navigate(from, { replace: true });
            return;
        }
        say(result.error, 'error', result.retryInSeconds ? [`Try again in ${result.retryInSeconds} seconds.`] : []);
        setToken('');
    }

    return (
        <>
            <ClayBlobs />
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
                <div className="mb-6 flex items-center justify-center gap-3">
                    <ClayIcon name="coin" size={56} float />
                    <div>
                        <h1 className="font-display text-[28px] leading-tight font-bold">
                            Pinlon <span className="text-pink-deep">POS</span>
                        </h1>
                        <p className="text-sm text-clay-muted">Admin dashboard</p>
                    </div>
                </div>

                <ClayCard title="Sign in" icon="staff" tone="lav">
                    <form onSubmit={submit} className="space-y-5" noValidate>
                        <ClayField label="Tenant ID" htmlFor="tenant-id">
                            <ClayInput id="tenant-id" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="pinlon" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required autoFocus />
                        </ClayField>
                        <ClayField label="Slug" htmlFor="slug">
                            <ClayInput id="slug" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="pos" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                        </ClayField>
                        <ClayField label="Token" htmlFor="token">
                            <div className="relative">
                                <ClayInput
                                    id="token"
                                    type={show ? 'text' : 'password'}
                                    autoComplete="off"
                                    spellCheck={false}
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                    className="pr-20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow((s) => !s)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-lg px-2 py-1 font-display text-sm font-semibold text-lav-deep focus-visible:outline-3 focus-visible:outline-lav-deep"
                                    aria-label={show ? 'Hide token' : 'Show token'}
                                >
                                    {show ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </ClayField>
                        <ClayButton type="submit" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</ClayButton>
                    </form>
                    <StatusMessage status={status} />
                </ClayCard>

                <p className="mt-6 text-center text-xs text-clay-muted">
                    Internal tool. The slug and token for each tenant are managed in the central dashboard (Tenants → LPMS integration).
                </p>
            </div>
        </>
    );
}
