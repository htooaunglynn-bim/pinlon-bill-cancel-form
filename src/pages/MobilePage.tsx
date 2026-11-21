import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { QrPreview } from '@/components/QrPreview';
import { StatusMessage } from '@/components/StatusMessage';
import { FieldError, PageHeader, Stat } from '@/components/ui';
import { useCustomerSession } from '@/context/CustomerSessionContext';
import { useTenant } from '@/context/TenantContext';
import { mmss, useCountdown } from '@/hooks/useCountdown';
import { usePosCall } from '@/hooks/usePosCall';
import { customerApi } from '@/lib/api';
import { formatPoints } from '@/lib/dates';
import { phoneError, toE164Mm } from '@/lib/phone';
import type { CustomerProfile, OtpRequestResult, OtpVerifyResult, PosScanQrResult } from '@/lib/types';

const DEVICE_NAME = 'pinlon-pos-admin';
const RESEND_SECONDS = 60;

type Step = 'phone' | 'code' | 'qr';

export function MobilePage() {
    const { tenant } = useTenant();
    const { session } = useCustomerSession();
    const [phone, setPhone] = useState('');
    const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
    const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);

    // A new hospital means a new customer context: start over at the phone step.
    useEffect(() => setOtpSentTo(null), [tenant.key]);

    const step: Step = session ? 'qr' : otpSentTo ? 'code' : 'phone';

    return (
        <div className="space-y-7">
            <PageHeader
                title="Customer app"
                subtitle="Act as the customer's Pinlon app: sign in with a phone number and OTP, then show the POS QR the terminal scans."
            />

            <Steps step={step} />

            <div className="mx-auto w-full max-w-[440px]">
                {step === 'phone' ? (
                    <PhoneStep phone={phone} setPhone={setPhone} onSent={(e164, exp) => { setOtpSentTo(e164); setOtpExpiresAt(exp); }} />
                ) : step === 'code' && otpSentTo ? (
                    <CodeStep phone={otpSentTo} initialExpiresAt={otpExpiresAt} onBack={() => setOtpSentTo(null)} />
                ) : (
                    <QrStep onSignedOut={() => setOtpSentTo(null)} />
                )}
            </div>
        </div>
    );
}

function Steps({ step }: { step: Step }) {
    const items: { key: Step; label: string }[] = [
        { key: 'phone', label: 'Phone' },
        { key: 'code', label: 'Code' },
        { key: 'qr', label: 'POS QR' },
    ];
    const index = items.findIndex((i) => i.key === step);
    return (
        <ol aria-label="Progress" className="mx-auto flex w-full max-w-[440px] items-center gap-2">
            {items.map((item, i) => {
                const state = i < index ? 'done' : i === index ? 'current' : 'todo';
                return (
                    <li key={item.key} className="flex flex-1 items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
                        <span
                            className={[
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold',
                                state === 'current' ? 'clay-inset bg-lav' : state === 'done' ? 'clay-inset bg-mint' : 'clay-inset bg-cream text-clay-muted',
                            ].join(' ')}
                        >
                            {state === 'done' ? '✓' : i + 1}
                        </span>
                        <span className={`font-display text-sm font-semibold ${state === 'todo' ? 'text-clay-muted' : ''}`}>{item.label}</span>
                        {i < items.length - 1 ? <span aria-hidden="true" className="mx-1 h-0 flex-1 border-t-2 border-dashed border-clay-edge" /> : null}
                    </li>
                );
            })}
        </ol>
    );
}

function PhoneStep({ phone, setPhone, onSent }: { phone: string; setPhone: (v: string) => void; onSent: (e164: string, expiresAt: number | null) => void }) {
    const { tenant } = useTenant();
    const call = usePosCall<OtpRequestResult>('customer');
    const [touched, setTouched] = useState(false);
    const error = phoneError(phone);
    const e164 = toE164Mm(phone);

    async function submit(e: FormEvent) {
        e.preventDefault();
        setTouched(true);
        if (error) return;
        const result = await call.run(
            () => customerApi<OtpRequestResult>(tenant, '/otp/request', {
                method: 'POST',
                json: { phone: e164, purpose: 'login' },
                log: { kind: 'otp-request', summary: `OTP requested for ${e164}`, meta: { phone: e164 } },
            }),
            () => `Code sent to ${e164}.`,
        );
        if (result.ok) {
            onSent(e164, Date.now() + (result.payload.data?.otp_expires_in ?? 300) * 1000);
        } else if (result.payload.error_code === 'OTP_COOLDOWN') {
            // A code is already out for this number; go straight to entering it.
            onSent(e164, null);
        }
    }

    return (
        <ClayCard title="Sign in" icon="staff" tone="lav" intro={<p>Enter the customer's registered mobile number. A 6-digit code is sent by SMS.</p>}>
            <form onSubmit={submit} className="space-y-5" noValidate>
                <ClayField label="Mobile number" htmlFor="phone">
                    <ClayInput
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        mono
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => setTouched(true)}
                        placeholder="09 123 456 789"
                        aria-invalid={touched && !!error}
                        aria-describedby="phone-help phone-err"
                        autoFocus
                    />
                    <FieldError id="phone-err">{touched ? error : undefined}</FieldError>
                    {!error ? <p id="phone-help" className="mt-1.5 text-sm text-clay-muted">Sent as <code>{e164}</code></p> : null}
                </ClayField>
                <ClayButton type="submit" disabled={call.busy}>{call.busy ? 'Sending…' : 'Send code'}</ClayButton>
            </form>
            <StatusMessage status={call.status} />
        </ClayCard>
    );
}

/** OTP_COOLDOWN carries `retry_after` (seconds) inside `errors`. */
function retryAfter(errors: Record<string, unknown> | undefined): number {
    const v = Number(errors?.retry_after ?? 0);
    return Number.isFinite(v) && v > 0 ? v : 0;
}

function CodeStep({ phone, initialExpiresAt, onBack }: { phone: string; initialExpiresAt: number | null; onBack: () => void }) {
    const { tenant } = useTenant();
    const { setSession } = useCustomerSession();
    const verify = usePosCall<OtpVerifyResult>('customer');
    const resend = usePosCall<OtpRequestResult>('customer');
    const [code, setCode] = useState('');
    const [expiresAt, setExpiresAt] = useState<number | null>(initialExpiresAt);
    const [resendAt, setResendAt] = useState<number>(() => Date.now() + RESEND_SECONDS * 1000);
    const expiresIn = useCountdown(expiresAt);
    const resendIn = useCountdown(resendAt);
    const submitted = useRef('');

    async function submit(value = code) {
        if (!/^\d{6}$/.test(value) || verify.busy) return;
        submitted.current = value;
        const result = await verify.run(
            () => customerApi<OtpVerifyResult>(tenant, '/otp/verify', {
                method: 'POST',
                json: { phone, code: value, purpose: 'login', device_name: DEVICE_NAME },
                log: { kind: 'otp-verify', summary: `OTP sign-in for ${phone}`, meta: { phone } },
            }),
            (d) => `Signed in as ${d.customer.name}.`,
        );
        const data = result.payload.data;
        if (result.ok && data) {
            setSession({ token: data.access_token, profile: data.customer, signedInAt: new Date().toISOString() });
        } else {
            setCode('');
        }
    }

    async function doResend() {
        const result = await resend.run(
            () => customerApi<OtpRequestResult>(tenant, '/otp/request', {
                method: 'POST',
                json: { phone, purpose: 'login' },
                log: { kind: 'otp-request', summary: `OTP re-sent to ${phone}`, meta: { phone } },
            }),
            () => `New code sent to ${phone}.`,
        );
        const wait = retryAfter(result.payload.errors);
        if (result.ok) {
            const exp = Date.now() + (result.payload.data?.otp_expires_in ?? 300) * 1000;
            setExpiresAt(exp);
            setResendAt(Date.now() + RESEND_SECONDS * 1000);
        } else if (wait > 0) {
            setResendAt(Date.now() + wait * 1000);
        }
    }

    return (
        <ClayCard
            title="Enter code"
            icon="sparkles"
            tone="sun"
            intro={
                <>
                    <p>
                        Code sent to <strong>{phone}</strong>
                        {expiresAt ? <> · {expiresIn > 0 ? <>expires in <strong>{mmss(expiresIn)}</strong></> : <strong className="text-pink-deep">expired</strong>}</> : null}
                    </p>
                    <p className="text-sm">Hospitals in test OTP mode (UAT) send no SMS and accept <code>000000</code>.</p>
                </>
            }
        >
            <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-5" noValidate>
                <ClayField label="6-digit code" htmlFor="otp">
                    <ClayInput
                        id="otp"
                        mono
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={code}
                        onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setCode(v);
                            // Auto-submit once all six digits are in (once per value).
                            if (v.length === 6 && v !== submitted.current) void submit(v);
                        }}
                        placeholder="••••••"
                        className="text-center !text-2xl tracking-[0.5em]"
                        autoFocus
                    />
                </ClayField>
                <ClayButton type="submit" disabled={code.length !== 6 || verify.busy}>{verify.busy ? 'Verifying…' : 'Verify & sign in'}</ClayButton>
            </form>
            <StatusMessage status={verify.status} />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-clay-edge pt-5">
                <ClayButton tone="ghost" compact type="button" onClick={onBack}>← Change number</ClayButton>
                <ClayButton tone="ghost" compact type="button" disabled={resendIn > 0 || resend.busy} onClick={() => void doResend()}>
                    {resendIn > 0 ? `Resend in ${mmss(resendIn)}` : resend.busy ? 'Sending…' : 'Resend code'}
                </ClayButton>
            </div>
            <StatusMessage status={resend.status} />
        </ClayCard>
    );
}

function QrStep({ onSignedOut }: { onSignedOut: () => void }) {
    const { tenant } = useTenant();
    const { session, signOut, forget, updateProfile, activeQr, setActiveQr } = useCustomerSession();
    const gen = usePosCall<PosScanQrResult>('customer');
    // Coming back to this page while a QR is still live shows it again, countdown and all.
    const [qr, setQr] = useState<PosScanQrResult | null>(() =>
        activeQr ? { qr_string: activeQr.qr, expires_at: activeQr.expiresAt, qr_image: '', token: '' } : null,
    );
    const expiresAtMs = qr?.expires_at ? new Date(qr.expires_at).getTime() : null;
    const left = useCountdown(expiresAtMs);
    const expired = !!qr && expiresAtMs !== null && left <= 1;
    // The shared QR is cleared after a successful earn/redeem: the token is spent.
    const used = !!qr && !expired && activeQr?.qr !== qr.qr_string;

    // Refresh the profile (points balance) when the step opens.
    useEffect(() => {
        if (!session) return;
        let alive = true;
        customerApi<CustomerProfile>(tenant, '/me', { token: session.token }).then((r) => {
            if (!alive) return;
            if (r.status === 401) forget();
            else if (r.ok && r.payload.data) updateProfile(r.payload.data);
        });
        return () => { alive = false; };
        // Only on mount / customer change.
    }, [session?.token]);

    if (!session) return null;
    const c = session.profile;

    async function generate() {
        if (!session) return;
        const result = await gen.run(
            () => customerApi<PosScanQrResult>(tenant, '/pos-scan', {
                method: 'POST',
                token: session.token,
                log: { kind: 'qr-posscan', summary: `POS QR for ${c.name} (${c.member_code})`, meta: { member: c.member_code } },
            }),
            () => 'POS QR ready. Valid for 5 minutes, single use.',
        );
        const data = result.payload.data;
        if (result.ok && data) {
            setQr(data);
            // Share it with the terminal pages until it expires or is used.
            setActiveQr({
                qr: data.qr_string,
                expiresAt: data.expires_at ?? new Date(Date.now() + 5 * 60_000).toISOString(),
                name: c.name,
                memberCode: c.member_code,
            });
        } else if (result.status === 401) forget();
    }

    const q = qr ? encodeURIComponent(qr.qr_string) : '';

    return (
        <div className="space-y-7">
            <ClayCard
                title={c.name}
                icon="success"
                tone="mint"
                actions={<ClayChip>{c.member_code}</ClayChip>}
            >
                <div className="grid grid-cols-2 gap-3">
                    <Stat label="Points" value={formatPoints(Number(c.points_balance))} tone="mint" />
                    <Stat label="Tier" value={c.tier?.name_en ?? c.tier?.name ?? 'None'} tone="lav" />
                </div>
                <p className="mt-3 text-sm text-clay-muted">
                    {c.phone ?? 'No phone'}
                    {c.is_family_member ? ' · family member' : ''}
                </p>
                <ClayButton
                    tone="ghost"
                    compact
                    type="button"
                    className="mt-4"
                    onClick={async () => { await signOut(); setQr(null); onSignedOut(); }}
                >
                    Sign out customer
                </ClayButton>
            </ClayCard>

            <ClayCard
                title="POS QR"
                icon="coin"
                tone="sun"
                delay={0.05}
                actions={qr ? <ClayChip className={expired ? '!bg-pink/40' : left <= 60 ? '!bg-sun' : '!bg-mint/50'}>{expired ? 'Expired' : mmss(left)}</ClayChip> : null}
            >
                {!qr ? (
                    <div className="space-y-4">
                        <p className="text-[15px] text-clay-muted">The customer shows this QR at the counter. The POS scans it to look them up and earn or redeem points.</p>
                        <ClayButton type="button" onClick={() => void generate()} disabled={gen.busy}>{gen.busy ? 'Generating…' : 'Generate POS QR'}</ClayButton>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className={expired ? 'opacity-35 grayscale transition' : 'transition'}>
                            <QrPreview value={qr.qr_string} size={220} filename={`posscan-${c.member_code}`} />
                        </div>
                        {expired ? (
                            <p className="text-center font-display font-semibold text-pink-deep">This QR has expired. Generate a new one.</p>
                        ) : used ? (
                            <p className="text-center font-display font-semibold text-clay-muted">This QR was used for an earn or redeem. Generate a new one.</p>
                        ) : (
                            <>
                            <p className="clay-inset rounded-blob bg-mint/25 px-4 py-2.5 text-center text-sm">
                                <strong>Ready on the POS terminal pages</strong> until it expires. No need to copy.
                            </p>
                            <div className="grid gap-2.5 sm:grid-cols-3">
                                <Link to={`/terminal/lookup?qr=${q}`} className="clay-pressable rounded-blob bg-lav px-3 py-2.5 text-center font-display text-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep">Look up</Link>
                                <Link to={`/terminal/points?type=earn&qr=${q}`} className="clay-pressable rounded-blob bg-mint px-3 py-2.5 text-center font-display text-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep">Earn</Link>
                                <Link to={`/terminal/points?type=redeem&qr=${q}`} className="clay-pressable rounded-blob bg-sun px-3 py-2.5 text-center font-display text-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep">Redeem</Link>
                            </div>
                            </>
                        )}
                        <ClayButton tone={expired || used ? 'primary' : 'ghost'} type="button" onClick={() => void generate()} disabled={gen.busy}>
                            {gen.busy ? 'Generating…' : expired || used ? 'Generate new QR' : 'Replace with a new QR'}
                        </ClayButton>
                    </div>
                )}
                <StatusMessage status={gen.status} />
            </ClayCard>
        </div>
    );
}
