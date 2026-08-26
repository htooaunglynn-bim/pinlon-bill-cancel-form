import { useState } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { useStatus } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';
import { DEVICE_NAME, OTP } from '@/lib/constants';

type Props = {
    onToken: (token: string) => void;
    onPid: (pid: string) => void;
    pid: string;
};

export function CustomerSession({ onToken, onPid, pid }: Props) {
    const { status, say } = useStatus();
    const [phoneInput, setPhoneInput] = useState('');
    const [busy, setBusy] = useState(false);

    async function getSession() {
        say('Working…', 'busy');
        setBusy(true);

        const logs: string[] = [];

        try {
            const stamp = new Date().toISOString().replace(/\D/g, '').slice(8, 14);
            let phone = phoneInput.trim();
            let resolvedPid = pid;

            if (!phone) {
                phone = `+9599${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
                const newPid = `E2E-${stamp}`;
                const register = await api('/api/v1/customer/qr/onboarding/create', {
                    method: 'POST',
                    form: { qr_string: `${newPid},E2E Test Customer,U Test,1990-01-01,${phone},M,normal` },
                });
                if (!register.ok) throw new Error(fail(register.payload, 'Registration failed.'));
                resolvedPid = newPid;
                onPid(newPid);
                logs.push(`registered ${phone} (pid ${newPid})`);
            }

            const otpRequest = await api('/api/v1/customer/otp/request', {
                method: 'POST',
                form: { phone, purpose: 'login' },
            });
            if (!otpRequest.ok) throw new Error(fail(otpRequest.payload, `OTP request failed for ${phone}.`));

            const verify = await api('/api/v1/customer/otp/verify', {
                method: 'POST',
                form: { phone, code: OTP, purpose: 'login', device_name: DEVICE_NAME },
            });
            const customerToken = verify.payload?.data?.access_token;
            if (!customerToken) throw new Error(fail(verify.payload, `Login failed — is ${OTP} accepted on this host?`));

            onToken(customerToken);

            if (!resolvedPid) {
                const me = await api('/api/v1/customer/me', { token: customerToken });
                if (me.ok) onPid(me.payload.data.member_code ?? '');
            }

            say(`Ready — phone ${phone}`, 'success', logs);
        } catch (error) {
            say((error as Error).message || 'Unable to contact the API.', 'error', logs);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <ClayField
                label="Customer phone"
                hint={<>(optional &mdash; blank registers a new customer)</>}
                htmlFor="phone"
            >
                <ClayInput
                    id="phone" type="tel" autoComplete="off" placeholder="+9591234567"
                    value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)}
                />
            </ClayField>

            <ClayButton tone="secondary" type="button" onClick={getSession} disabled={busy} className="mt-5">
                Get customer session
            </ClayButton>

            <StatusMessage status={status} />
        </>
    );
}
