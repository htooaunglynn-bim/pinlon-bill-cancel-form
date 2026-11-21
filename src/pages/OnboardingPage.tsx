import { useMemo, useState } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { ClaySelect } from '@/components/ClaySelect';
import { QrLabelSheet } from '@/components/QrLabelSheet';
import { QrPreview } from '@/components/QrPreview';
import { ClayTextarea, Divider, FieldError, PageHeader, Segmented, Toggle } from '@/components/ui';
import { useRecordQr } from '@/hooks/useRecordQr';
import { yangonToday } from '@/lib/dates';
import { usePrefs } from '@/lib/prefs';
import { hasErrors } from '@/lib/qr/common';
import {
    buildOnboardingQr,
    EMPTY_ONBOARDING,
    type Gender,
    type OnboardingField,
    type OnboardingInput,
    type OnboardingMode,
    parseOnboardingBatch,
    validateOnboarding,
} from '@/lib/qr/onboarding';

const SAMPLE = `# PID,Name,FatherName,DOB(YYYY-MM-DD),Phone,Gender(M/F/other)[,baby]
P-10001,Aung Aung,U Ba,1990-05-14,09123456789,M
P-10002,Su Su,U Hla,1985-11-02,09987654321,F`;

export function OnboardingPage() {
    const { ageLimit } = usePrefs();
    const record = useRecordQr();
    const [tab, setTab] = useState<'single' | 'batch'>('single');
    const [mode, setMode] = useState<OnboardingMode>('onboarding');
    const [form, setForm] = useState<OnboardingInput>(EMPTY_ONBOARDING);
    const [touched, setTouched] = useState<Partial<Record<OnboardingField, boolean>>>({});
    const [batchText, setBatchText] = useState('');
    const [printTarget, setPrintTarget] = useState<'single' | 'batch'>('single');

    const errors = validateOnboarding(form, mode, ageLimit);
    const valid = !hasErrors(errors);
    const qr = valid ? buildOnboardingQr(form, mode) : null;
    const kind = mode === 'onboarding' ? 'qr-onboarding' : 'qr-link';

    const batch = useMemo(() => (batchText.trim() ? parseOnboardingBatch(batchText, mode, ageLimit) : []), [batchText, mode, ageLimit]);
    const goodRows = batch.filter((r) => r.qr);

    function set<K extends OnboardingField>(key: K, value: OnboardingInput[K]) {
        setForm((f) => ({ ...f, [key]: value }));
        setTouched((t) => ({ ...t, [key]: true }));
    }

    const show = (k: OnboardingField) => (touched[k] ? errors[k] : undefined);

    function printWith(target: 'single' | 'batch') {
        setPrintTarget(target);
        // Let React swap the print-area class before the dialog opens.
        setTimeout(() => window.print(), 50);
    }

    function printBatch() {
        goodRows.forEach((r) => r.qr && record(kind, r.qr, `${r.input.pid} · ${r.input.name}`, { pid: r.input.pid }));
        printWith('batch');
    }

    return (
        <div className="space-y-7">
            <PageHeader
                title="Onboarding QR"
                subtitle="QR codes customers scan in the Pinlon app to register (or link a family member) with their hospital PID."
            >
                <Segmented
                    label="Single or batch"
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: 'single', label: 'Single' },
                        { value: 'batch', label: 'Batch' },
                    ]}
                />
            </PageHeader>

            <div className="print-hide">
                <Segmented
                    label="QR type"
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: 'onboarding', label: 'New member (7 fields)' },
                        { value: 'link', label: 'Family link (6–7 fields)' },
                    ]}
                />
                <p className="mt-2 text-sm text-clay-muted">
                    {mode === 'onboarding'
                        ? `Primary member: phone required, at least ${ageLimit} years old.`
                        : `Linked dependent: phone optional, younger than ${ageLimit}.`}
                </p>
            </div>

            {tab === 'single' ? (
                <div className="grid gap-7 xl:grid-cols-[1fr_340px]">
                    <ClayCard title="Customer details" icon="staff" tone="lav">
                        <form className="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
                            <ClayField label="PID" hint="hospital patient ID" htmlFor="pid">
                                <ClayInput id="pid" mono value={form.pid} onChange={(e) => set('pid', e.target.value.toUpperCase())} placeholder="P-10001" aria-invalid={!!show('pid')} aria-describedby="pid-err" />
                                <FieldError id="pid-err">{show('pid')}</FieldError>
                            </ClayField>
                            <ClayField label="Phone" hint={mode === 'link' ? '(optional)' : undefined} htmlFor="phone">
                                <ClayInput id="phone" mono inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value.trim())} placeholder="09123456789" aria-invalid={!!show('phone')} aria-describedby="phone-err" />
                                <FieldError id="phone-err">{show('phone')}</FieldError>
                            </ClayField>
                            <ClayField label="Name" htmlFor="name">
                                <ClayInput id="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!show('name')} aria-describedby="name-err" />
                                <FieldError id="name-err">{show('name')}</FieldError>
                            </ClayField>
                            <ClayField label="Father name" htmlFor="father">
                                <ClayInput id="father" value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)} aria-invalid={!!show('fatherName')} aria-describedby="father-err" />
                                <FieldError id="father-err">{show('fatherName')}</FieldError>
                            </ClayField>
                            <ClayField label="Date of birth" htmlFor="dob">
                                <ClayInput id="dob" type="date" max={yangonToday()} value={form.dob} onChange={(e) => set('dob', e.target.value)} aria-invalid={!!show('dob')} aria-describedby="dob-err" />
                                <FieldError id="dob-err">{show('dob')}</FieldError>
                            </ClayField>
                            <ClayField label="Gender" htmlFor="gender">
                                <ClaySelect id="gender" value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
                                    <option value="M">Male (M)</option>
                                    <option value="F">Female (F)</option>
                                    <option value="other">Other</option>
                                </ClaySelect>
                            </ClayField>
                            <div className="sm:col-span-2">
                                <Toggle id="baby" checked={form.baby} onChange={(v) => set('baby', v)} label="Baby (newborn without own record)" />
                            </div>
                        </form>
                        <Divider />
                        <div className="flex flex-wrap gap-3">
                            <ClayButton tone="ghost" compact type="button" onClick={() => { setForm(EMPTY_ONBOARDING); setTouched({}); }}>Clear form</ClayButton>
                            <ClayButton
                                tone="ghost"
                                compact
                                type="button"
                                onClick={() => setTouched({ pid: true, name: true, fatherName: true, dob: true, phone: true })}
                            >
                                Check all fields
                            </ClayButton>
                        </div>
                    </ClayCard>

                    <div className="xl:sticky xl:top-8 xl:self-start">
                        <ClayCard title="QR code" icon="preview" tone="mint" delay={0.05}>
                            <QrPreview
                                value={qr}
                                size={220}
                                filename={`${mode}-${form.pid}`}
                                onPrint={() => printWith('single')}
                                onAction={() => qr && record(kind, qr, `${form.pid} · ${form.name}`, { pid: form.pid })}
                                emptyText={hasErrors(errors) && Object.keys(touched).length ? 'Fix the highlighted fields.' : 'Fill in the form to see the QR.'}
                            />
                        </ClayCard>
                    </div>

                    {qr ? (
                        <div className={`hidden print:block ${printTarget === 'single' ? 'print-area' : ''}`}>
                            <QrLabelSheet
                                printable={false}
                                labels={[{ qr, title: `${form.name} (${form.pid.toUpperCase()})`, lines: [mode === 'onboarding' ? 'Scan to join Pinlon rewards' : 'Scan to link family member'] }]}
                            />
                        </div>
                    ) : null}
                </div>
            ) : (
                <ClayCard
                    title="Batch generate"
                    icon="formulas"
                    tone="sun"
                    intro={<p>Paste one customer per line, in QR field order. Lines starting with # are ignored. Only valid rows are printed.</p>}
                    actions={<ClayChip>{goodRows.length}/{batch.length} valid</ClayChip>}
                >
                    <ClayTextarea rows={7} value={batchText} onChange={(e) => setBatchText(e.target.value)} placeholder={SAMPLE} aria-label="Batch CSV" />
                    <div className="mt-3 flex flex-wrap gap-3">
                        <ClayButton tone="ghost" compact type="button" onClick={() => setBatchText(SAMPLE)}>Load sample</ClayButton>
                        <label className="clay-pressable cursor-pointer rounded-blob bg-card px-4 py-2 font-display text-sm font-semibold focus-within:outline-3 focus-within:outline-lav-deep">
                            Upload CSV
                            <input
                                type="file"
                                accept=".csv,text/csv,text/plain"
                                className="sr-only"
                                onChange={async (e) => { const f = e.target.files?.[0]; if (f) setBatchText(await f.text()); }}
                            />
                        </label>
                        <ClayButton tone="secondary" compact type="button" disabled={!goodRows.length} onClick={printBatch}>Print {goodRows.length} labels</ClayButton>
                    </div>

                    {batch.some((r) => !r.qr) ? (
                        <ul className="clay-inset mt-5 space-y-1.5 rounded-blob bg-pink/20 px-4 py-3 text-sm">
                            {batch.filter((r) => !r.qr).map((r) => (
                                <li key={r.line} className="text-pink-deep">
                                    <strong>Line {r.line}:</strong> {Object.values(r.errors).filter(Boolean).join(' ')}
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {goodRows.length ? (
                        <>
                            <Divider />
                            <QrLabelSheet
                                printable={printTarget === 'batch'}
                                labels={goodRows.map((r) => ({ qr: r.qr as string, title: `${r.input.name} (${r.input.pid.toUpperCase()})`, lines: [r.input.phone || 'no phone'] }))}
                            />
                        </>
                    ) : null}
                </ClayCard>
            )}
        </div>
    );
}
