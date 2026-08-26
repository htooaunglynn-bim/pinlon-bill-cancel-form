import { useState } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { useStatus } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';

type Props = {
    customerToken: string | null;
    pid: string;
    onPid: (pid: string) => void;
};

export function EarnForm({ customerToken, pid, onPid }: Props) {
    const { status, say } = useStatus();
    const [bid, setBid] = useState('');
    const [amount, setAmount] = useState('50000');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [department, setDepartment] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(event: React.FormEvent) {
        event.preventDefault();

        if (!customerToken) {
            say('Get a customer session first.', 'error');
            return;
        }

        say('Submitting…', 'busy');
        setBusy(true);

        try {
            const resolvedBid = bid || `E2EBID-${Date.now()}`;
            if (!bid) setBid(resolvedBid);

            const trimmedDepartment = department.trim();
            const parts = [pid.trim(), resolvedBid.trim(), amount.trim(), date.trim()];
            if (trimmedDepartment) parts.push(trimmedDepartment);

            const { ok, payload } = await api('/api/v1/customer/qr/invoice/earn', {
                method: 'POST',
                token: customerToken,
                form: { qr_string: parts.join(',') },
            });

            if (!ok) throw new Error(fail(payload, 'Earn failed.'));

            const transaction = payload.data.transaction;
            say(
                `Earned ${transaction.points} points (department: ${payload.data.department || 'default'}).`,
                'success',
                [`balance_after = ${transaction.balance_after}`],
            );
            setBid('');
        } catch (error) {
            say((error as Error).message || 'Unable to contact the API.', 'error');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit}>
            <ClayField label="PID" htmlFor="pid">
                <ClayInput
                    id="pid" name="pid" type="text" autoComplete="off" required
                    value={pid} onChange={(event) => onPid(event.target.value)}
                />
            </ClayField>

            <ClayField
                label="BID"
                hint={<>(auto-filled with a unique value; edit if you want)</>}
                htmlFor="bid"
                className="mt-4"
            >
                <ClayInput
                    id="bid" name="bid" type="text" autoComplete="off" required
                    placeholder="E2EBID-…"
                    value={bid} onChange={(event) => setBid(event.target.value)}
                />
            </ClayField>

            <div className="mt-4 flex gap-3">
                <ClayField label="Amount (MMK)" htmlFor="amount" className="flex-1">
                    <ClayInput
                        id="amount" name="amount" type="number" min="1"
                        value={amount} onChange={(event) => setAmount(event.target.value)}
                    />
                </ClayField>
                <ClayField label="Date" hint={<>(must be today)</>} htmlFor="date" className="flex-1">
                    <ClayInput
                        id="date" name="date" type="text" autoComplete="off"
                        value={date} onChange={(event) => setDate(event.target.value)}
                    />
                </ClayField>
            </div>

            <ClayField
                label="Department"
                hint={<>(optional &mdash; leave blank to use the default formula)</>}
                htmlFor="department"
                className="mt-4"
            >
                <ClayInput
                    id="department" name="department" type="text" autoComplete="off" placeholder="e.g. Cardiology"
                    value={department} onChange={(event) => setDepartment(event.target.value)}
                />
            </ClayField>

            <ClayButton type="submit" disabled={busy} className="mt-6">Earn points</ClayButton>

            <StatusMessage status={status} />
        </form>
    );
}
