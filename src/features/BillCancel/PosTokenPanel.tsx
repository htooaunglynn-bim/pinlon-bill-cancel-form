import { useState } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { useSession } from '@/context/SessionContext';
import { useStatus } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';

/** Show enough of the token to recognise it, never enough to reuse it. */
function mask(token: string): string {
    return token.length <= 8 ? '••••••••' : `${token.slice(0, 4)}…${token.slice(-4)}`;
}

/**
 * The POS plane's equivalent of Staff Login, inline on this page because the token is a
 * single shared secret rather than an account. GET /pos/health validates it with no side
 * effects, so nothing is stored until the API has accepted it.
 */
export function PosTokenPanel() {
    const { posToken, setPosToken, signOutPos } = useSession();
    const { status, say } = useStatus();
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [showToken, setShowToken] = useState(false);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        const token = draft.trim();
        if (!token) {
            say('Paste the POS token first.', 'error');
            return;
        }

        say('Checking the token…', 'busy');
        setBusy(true);

        try {
            const { ok, payload } = await api('/api/v1/public/pos/health', { token });
            if (!ok) throw new Error(fail(payload, 'POS token rejected.'));

            setPosToken(token);
            setDraft('');
            say('POS token accepted.', 'success');
        } catch (error) {
            say((error as Error).message || 'Unable to contact the API.', 'error');
        } finally {
            setBusy(false);
        }
    }

    if (posToken) {
        return (
            <div>
                <div className="clay-inset flex flex-wrap items-center gap-3 rounded-blob bg-mint/25 px-4 py-3">
                    <span className="font-display text-[15px] font-semibold text-mint-deep">POS token set</span>
                    <span className="font-mono text-xs text-clay-muted">{showToken ? posToken : mask(posToken)}</span>
                    <button
                        type="button"
                        onClick={() => setShowToken((value) => !value)}
                        aria-expanded={showToken}
                        className="cursor-pointer font-display text-sm font-semibold text-lav-deep underline underline-offset-4"
                    >
                        {showToken ? 'Hide' : 'Show'}
                    </button>
                    <ClayButton
                        tone="ghost"
                        type="button"
                        compact
                        className="ml-auto"
                        onClick={() => { signOutPos(); setShowToken(false); }}
                    >
                        Forget token
                    </ClayButton>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={submit}>
            <ClayField
                label="POS token"
                hint={<>(the shared <code>POS_POINT_PAYMENT_TOKEN</code> &mdash; kept in this tab only, never in the build)</>}
                htmlFor="pos-token"
            >
                <ClayInput
                    id="pos-token" name="pos-token" type="password" autoComplete="off" mono required
                    placeholder="Bearer token"
                    value={draft} onChange={(event) => setDraft(event.target.value)}
                />
            </ClayField>

            <ClayButton type="submit" disabled={busy} className="mt-4">Verify &amp; save token</ClayButton>

            <StatusMessage status={status} />
        </form>
    );
}
