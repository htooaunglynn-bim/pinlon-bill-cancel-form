import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { useSession } from '@/context/SessionContext';
import { useStatus } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';
import { DEVICE_NAME } from '@/lib/constants';

export function StaffLoginPage() {
    const { staffToken, setStaff } = useSession();
    const navigate = useNavigate();
    const { status, say } = useStatus();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [showToken, setShowToken] = useState(false);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        say('Logging in…', 'busy');
        setBusy(true);

        try {
            const { ok, payload } = await api('/api/v1/staff/login', {
                method: 'POST',
                form: { email: email.trim(), password, device_name: DEVICE_NAME },
            });
            if (!ok) throw new Error(fail(payload, 'Staff login failed.'));

            const loggedInEmail = payload.data.user?.email ?? null;
            setStaff(payload.data.access_token, loggedInEmail);
            say(`Logged in as ${loggedInEmail ?? 'staff'}.`, 'success');
            navigate('/formulas');
        } catch (error) {
            say((error as Error).message || 'Unable to contact the API.', 'error');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="max-w-[760px]">
            <ClayCard
                title="Staff Login"
                icon="staff"
                tone="lav"
                delay={0.05}
                intro={
                    <></>
                }
            >
                <form onSubmit={submit}>
                    <ClayField label="Staff email" htmlFor="staff-email">
                        <ClayInput
                            id="staff-email" name="email" type="email" autoComplete="off" required
                            value={email} onChange={(event) => setEmail(event.target.value)}
                        />
                    </ClayField>

                    <ClayField label="Staff password" htmlFor="staff-password" className="mt-4">
                        <ClayInput
                            id="staff-password" name="password" type="password" autoComplete="off" required
                            value={password} onChange={(event) => setPassword(event.target.value)}
                        />
                    </ClayField>

                    <ClayButton type="submit" disabled={busy} className="mt-6">Staff login</ClayButton>

                    <StatusMessage status={status} />

                    {staffToken ? (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() => setShowToken((value) => !value)}
                                aria-expanded={showToken}
                                className="cursor-pointer font-display text-sm font-semibold text-lav-deep underline underline-offset-4"
                            >
                                {showToken ? 'Hide token' : 'Show token'}
                            </button>
                            {showToken ? (
                                <p className="clay-inset mt-2 rounded-blob bg-cream px-4 py-3 font-mono text-xs break-all text-clay-muted">
                                    {staffToken}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </form>
            </ClayCard>
        </div>
    );
}
