import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { QrLabelSheet } from '@/components/QrLabelSheet';
import { QrImage, QrPreview } from '@/components/QrPreview';
import { ClayTextarea, Divider, FieldError, FieldWarning, PageHeader, Segmented } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { useRecordQr } from '@/hooks/useRecordQr';
import { formatMmk, toQrDate } from '@/lib/dates';
import { usePrefs } from '@/lib/prefs';
import { hasErrors } from '@/lib/qr/common';
import { buildInvoiceQr, emptyInvoice, type InvoiceField, type InvoiceInput, invoiceWarnings, newBid, parseInvoiceBatch, validateInvoice } from '@/lib/qr/invoice';

const SAMPLE = `# PID,BID(blank = auto),Department(blank or Null = none),Amount[,Date]
P-10001,,OPD,25000
P-10002,BILL-A-0002,Pharmacy,12000
P-10003,,Null,8000`;

export function InvoicePage() {
    const prefs = usePrefs();
    const { tenant } = useTenant();
    const record = useRecordQr();
    const [tab, setTab] = useState<'single' | 'batch'>('single');
    const [form, setForm] = useState<InvoiceInput>(emptyInvoice);
    const [touched, setTouched] = useState<Partial<Record<InvoiceField, boolean>>>({});
    const [batchText, setBatchText] = useState('');
    const [printTarget, setPrintTarget] = useState<'receipt' | 'batch'>('receipt');

    const errors = validateInvoice(form);
    const warnings = invoiceWarnings(form, prefs.minimumInvoiceAmount);
    const qr = hasErrors(errors) ? null : buildInvoiceQr(form);

    const batch = useMemo(() => (batchText.trim() ? parseInvoiceBatch(batchText) : []), [batchText]);
    const goodRows = batch.filter((r) => r.qr);

    function set<K extends InvoiceField>(key: K, value: InvoiceInput[K]) {
        setForm((f) => ({ ...f, [key]: value }));
        setTouched((t) => ({ ...t, [key]: true }));
    }
    const show = (k: InvoiceField) => (touched[k] ? errors[k] : undefined);

    function recordInvoice(input: InvoiceInput, q: string) {
        record('qr-invoice', q, `${input.bid} · ${input.pid} · ${formatMmk(input.amount)}`, { bid: input.bid, pid: input.pid, amount: input.amount });
    }

    function printWith(target: 'receipt' | 'batch') {
        setPrintTarget(target);
        setTimeout(() => window.print(), 50);
    }

    return (
        <div className="space-y-7">
            <PageHeader title="Invoice QR" subtitle="Bill QR codes printed on receipts. Customers scan them in the Pinlon app on the same day to earn points.">
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

            {tab === 'single' ? (
                <div className="grid gap-7 xl:grid-cols-[1fr_340px]">
                    <div className="space-y-7">
                        <ClayCard title="Bill details" icon="preview" tone="sun">
                            <form className="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
                                <ClayField label="PID" hint="patient ID" htmlFor="pid">
                                    <ClayInput id="pid" mono value={form.pid} onChange={(e) => set('pid', e.target.value.toUpperCase())} placeholder="P-10001" aria-invalid={!!show('pid')} aria-describedby="pid-err" />
                                    <FieldError id="pid-err">{show('pid')}</FieldError>
                                </ClayField>
                                <ClayField label="Bill ID (BID)" hint="must be unique" htmlFor="bid">
                                    <div className="flex gap-2">
                                        <ClayInput id="bid" mono value={form.bid} onChange={(e) => set('bid', e.target.value)} aria-invalid={!!show('bid')} aria-describedby="bid-err" />
                                        <ClayButton tone="ghost" compact type="button" onClick={() => set('bid', newBid())} aria-label="Generate new bill ID" className="shrink-0">↻</ClayButton>
                                    </div>
                                    <FieldError id="bid-err">{show('bid')}</FieldError>
                                </ClayField>
                                <ClayField label="Department" hint="blank = none (Null)" htmlFor="dept">
                                    <ClayInput id="dept" value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="OPD" aria-invalid={!!show('department')} aria-describedby="dept-err" />
                                    <FieldError id="dept-err">{show('department')}</FieldError>
                                </ClayField>
                                <ClayField label="Amount" hint="MMK" htmlFor="amount">
                                    <ClayInput id="amount" type="number" inputMode="decimal" min={0} value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="25000" aria-invalid={!!show('amount')} aria-describedby="amount-err" />
                                    <FieldError id="amount-err">{show('amount')}</FieldError>
                                    <FieldWarning>{warnings.amount}</FieldWarning>
                                </ClayField>
                                <ClayField label="Bill date" htmlFor="date">
                                    <ClayInput id="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} aria-invalid={!!show('date')} />
                                    <FieldError>{show('date')}</FieldError>
                                    <FieldWarning>{warnings.date}</FieldWarning>
                                </ClayField>
                            </form>
                            <Divider />
                            <div className="flex flex-wrap gap-3">
                                <ClayButton tone="ghost" compact type="button" onClick={() => { setForm(emptyInvoice()); setTouched({}); }}>New bill</ClayButton>
                                {qr ? (
                                    <Link
                                        to={`/terminal/bill-cancel?bill=${encodeURIComponent(form.bid)}`}
                                        className="clay-pressable rounded-blob bg-pink px-4 py-2 font-display text-sm font-semibold focus-visible:outline-3 focus-visible:outline-lav-deep"
                                    >
                                        Cancel this bill…
                                    </Link>
                                ) : null}
                            </div>
                        </ClayCard>

                        {qr ? (
                            <ClayCard title="Receipt preview" icon="success" tone="mint" delay={0.05} intro={<p>Prints at 80mm on thermal printers. Edit the header and footer in Settings.</p>}>
                                <div className={printTarget === 'receipt' ? 'print-area' : ''}>
                                    <Receipt input={form} qr={qr} header={prefs.receiptHeader} footer={prefs.receiptFooter} tenantName={tenant.name} />
                                </div>
                            </ClayCard>
                        ) : null}
                    </div>

                    <div className="xl:sticky xl:top-8 xl:self-start">
                        <ClayCard title="QR code" icon="coin" tone="lav" delay={0.05}>
                            <QrPreview
                                value={qr}
                                size={220}
                                filename={`invoice-${form.bid}`}
                                onPrint={() => printWith('receipt')}
                                onAction={() => qr && recordInvoice(form, qr)}
                            />
                        </ClayCard>
                    </div>
                </div>
            ) : (
                <ClayCard
                    title="Batch generate"
                    icon="formulas"
                    tone="sun"
                    intro={<p>One bill per line. A blank BID gets a generated one; a blank date means today.</p>}
                    actions={<ClayChip>{goodRows.length}/{batch.length} valid</ClayChip>}
                >
                    <ClayTextarea rows={7} value={batchText} onChange={(e) => setBatchText(e.target.value)} placeholder={SAMPLE} aria-label="Batch CSV" />
                    <div className="mt-3 flex flex-wrap gap-3">
                        <ClayButton tone="ghost" compact type="button" onClick={() => setBatchText(SAMPLE)}>Load sample</ClayButton>
                        <label className="clay-pressable cursor-pointer rounded-blob bg-card px-4 py-2 font-display text-sm font-semibold focus-within:outline-3 focus-within:outline-lav-deep">
                            Upload CSV
                            <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setBatchText(await f.text()); }} />
                        </label>
                        <ClayButton
                            tone="secondary"
                            compact
                            type="button"
                            disabled={!goodRows.length}
                            onClick={() => {
                                goodRows.forEach((r) => r.qr && recordInvoice(r.input, r.qr));
                                printWith('batch');
                            }}
                        >
                            Print {goodRows.length} labels
                        </ClayButton>
                    </div>

                    {batch.some((r) => !r.qr) ? (
                        <ul className="clay-inset mt-5 space-y-1.5 rounded-blob bg-pink/20 px-4 py-3 text-sm">
                            {batch.filter((r) => !r.qr).map((r) => (
                                <li key={r.line} className="text-pink-deep"><strong>Line {r.line}:</strong> {Object.values(r.errors).filter(Boolean).join(' ')}</li>
                            ))}
                        </ul>
                    ) : null}

                    {goodRows.length ? (
                        <>
                            <Divider />
                            <QrLabelSheet
                                printable={printTarget === 'batch'}
                                labels={goodRows.map((r) => ({
                                    qr: r.qr as string,
                                    title: r.input.bid,
                                    lines: [`${r.input.pid.toUpperCase()} · ${r.input.department || 'No department'}`, `${formatMmk(r.input.amount)} · ${toQrDate(r.input.date)}`],
                                }))}
                            />
                        </>
                    ) : null}
                </ClayCard>
            )}
        </div>
    );
}

function Receipt({ input, qr, header, footer, tenantName }: { input: InvoiceInput; qr: string; header: string; footer: string; tenantName: string }) {
    const row = (k: string, v: string) => (
        <div className="flex justify-between gap-4">
            <span>{k}</span>
            <span className="text-right font-semibold">{v}</span>
        </div>
    );
    return (
        <div className="print-receipt mx-auto w-full max-w-[300px] rounded-[10px] bg-white px-5 py-6 font-mono text-[12px] text-clay-ink shadow-[0_4px_14px_rgba(91,70,54,0.15)] print:shadow-none">
            <p className="text-center text-[14px] font-bold">{header || tenantName}</p>
            <p className="mb-3 text-center text-[11px] opacity-70">{toQrDate(input.date)}</p>
            <div className="space-y-1 border-y border-dashed border-current/40 py-2">
                {row('Bill', input.bid)}
                {row('PID', input.pid.toUpperCase())}
                {row('Dept', input.department || '-')}
            </div>
            <div className="my-2 text-[14px]">{row('TOTAL', formatMmk(input.amount))}</div>
            <div className="my-3 flex justify-center">
                <QrImage value={qr} size={168} />
            </div>
            <p className="text-center text-[11px]">{footer}</p>
        </div>
    );
}
