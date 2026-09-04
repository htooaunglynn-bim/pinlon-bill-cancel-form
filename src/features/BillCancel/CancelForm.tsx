import { useState } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { useStatus } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';
import type { BillCancelResult } from '@/lib/types';
import { CANCEL_HINTS } from './errors';

const REASON_MAX = 500;

type Props = {
    posToken: string | null;
    onResult: (result: BillCancelResult | null) => void;
    /** Called on a 401 so the token panel drops back to its entry state. */
    onTokenRejected: () => void;
};

export function CancelForm({ posToken, onResult, onTokenRejected }: Props) {
    const { status, say } = useStatus();
    const [billId, setBillId] = useState('');
    const [redemptionId, setRedemptionId] = useState('');
    const [reason, setReason] = useState('');
    const [locationId, setLocationId] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(event: React.FormEvent) {
        event.preventDefault();

        if (!posToken) {
            say('Verify a POS token first.', 'error');
            return;
        }

        // A stale success panel under a fresh error reads as if the new call succeeded.
        onResult(null);
        say('Cancelling…', 'busy');
        setBusy(true);

        try {
            // Blank optional fields are omitted, not sent empty: '' fails the integer rule on
            // location_id, and an empty redemption_id would read as "reverse a redeem leg too".
            const form: Record<string, string> = { bill_id: billId.trim() };
            if (redemptionId.trim()) form.redemption_id = redemptionId.trim();
            if (reason.trim()) form.reason = reason.trim();
            if (locationId.trim()) form.location_id = locationId.trim();

            const { ok, status: httpStatus, payload } = await api('/api/v1/public/pos/bill/cancel', {
                method: 'POST',
                token: posToken,
                form,
            });

            if (!ok) {
                if (httpStatus === 401) onTokenRejected();
                const hint = CANCEL_HINTS[payload.error_code ?? ''];
                say(fail(payload, 'Bill cancel failed.'), 'error', [
                    ...(payload.error_code ? [`error_code = ${payload.error_code}`] : []),
                    ...(hint ? [hint] : []),
                ]);
                return;
            }

            const result = payload.data as BillCancelResult;
            onResult(result);

            const legs = result.reversals.map((reversal) => reversal.reversal_type).join(' + ') || 'no legs';
            say(`Cancelled — ${legs}.`, 'success', [
                `net_points_change = ${result.net_points_change}`,
                `balance now ${result.points_balance_after}`,
            ]);
        } catch (error) {
            say((error as Error).message || 'Unable to contact the API.', 'error');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit}>
            <ClayField
                label="bill_id"
                hint={<>(required &mdash; the reference the bill <strong>earned</strong> under: an invoice BID, or a POS scan reference)</>}
                htmlFor="bill-id"
            >
                <ClayInput
                    id="bill-id" name="bill_id" type="text" autoComplete="off" mono required
                    maxLength={100} disabled={!posToken}
                    placeholder="E2EINV-123456"
                    value={billId} onChange={(event) => setBillId(event.target.value)}
                />
            </ClayField>

            <ClayField
                label="redemption_id"
                hint={<>(optional &mdash; the reference the bill <strong>spent</strong> under: a point-payment uuid, or a pos_redeem reference)</>}
                htmlFor="redemption-id"
                className="mt-4"
            >
                <ClayInput
                    id="redemption-id" name="redemption_id" type="text" autoComplete="off" mono
                    maxLength={100} disabled={!posToken}
                    placeholder="leave blank for an earn-only bill"
                    value={redemptionId} onChange={(event) => setRedemptionId(event.target.value)}
                />
            </ClayField>

            <ClayField
                label="reason"
                hint={<>(optional, {reason.length}/{REASON_MAX})</>}
                htmlFor="reason"
                className="mt-4"
            >
                <ClayInput
                    id="reason" name="reason" type="text" autoComplete="off"
                    maxLength={REASON_MAX} disabled={!posToken}
                    placeholder="e.g. customer returned item"
                    value={reason} onChange={(event) => setReason(event.target.value)}
                />
            </ClayField>

            <ClayField
                label="location_id"
                hint={<>(optional)</>}
                htmlFor="location-id"
                className="mt-4"
            >
                <ClayInput
                    id="location-id" name="location_id" type="number" min="1" autoComplete="off"
                    disabled={!posToken}
                    value={locationId} onChange={(event) => setLocationId(event.target.value)}
                />
            </ClayField>

            <ClayButton tone="danger" type="submit" disabled={busy || !posToken} className="mt-6">
                Cancel bill
            </ClayButton>

            <StatusMessage status={status} />
        </form>
    );
}
