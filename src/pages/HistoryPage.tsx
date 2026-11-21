import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayChip } from '@/components/ClayChip';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { ClaySelect } from '@/components/ClaySelect';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QrPreview } from '@/components/QrPreview';
import { JsonBlock, KeyValue, PageHeader } from '@/components/ui';
import { useTenant } from '@/context/TenantContext';
import { whenText } from '@/lib/dates';
import { clearHistory, exportCsv, exportJson, type HistoryEntry, type HistoryKind, KIND_LABEL, useHistory } from '@/lib/history';

const PER_PAGE = 25;

export function HistoryPage() {
    const all = useHistory();
    const { tenants } = useTenant();
    const [kind, setKind] = useState<'' | HistoryKind>('');
    const [tenantKey, setTenantKey] = useState('');
    const [result, setResult] = useState<'' | 'ok' | 'fail'>('');
    const [date, setDate] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<HistoryEntry | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return all.filter((h) => {
            if (kind && h.kind !== kind) return false;
            if (tenantKey && h.tenant !== tenantKey) return false;
            if (result === 'ok' && !h.ok) return false;
            if (result === 'fail' && h.ok) return false;
            if (date && !h.at.startsWith(date) && new Date(h.at).toLocaleDateString('en-CA') !== date) return false;
            if (q && !`${h.summary} ${JSON.stringify(h.meta ?? {})}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [all, kind, tenantKey, result, date, search]);

    useEffect(() => setPage(1), [kind, tenantKey, result, date, search]);

    const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const visible = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const tenantName = (key: string) => tenants.find((t) => t.key === key)?.name ?? key;

    return (
        <div className="space-y-7">
            <PageHeader title="Activity history" subtitle="Every POS call and generated QR from this browser. Stored locally (last 1,000 entries).">
                <div className="flex flex-wrap gap-2">
                    <ClayButton tone="ghost" compact type="button" disabled={!rows.length} onClick={() => exportCsv(rows)}>Export CSV</ClayButton>
                    <ClayButton tone="ghost" compact type="button" disabled={!rows.length} onClick={() => exportJson(rows)}>Export JSON</ClayButton>
                    <ClayButton tone="danger" compact type="button" disabled={!all.length} onClick={() => setConfirmClear(true)}>Clear</ClayButton>
                </div>
            </PageHeader>

            <ClayCard title="Filters" icon="formulas" tone="lav" actions={<ClayChip>{rows.length} of {all.length}</ClayChip>}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <ClayField label="Type" htmlFor="f-kind">
                        <ClaySelect id="f-kind" value={kind} onChange={(e) => setKind(e.target.value as HistoryKind | '')}>
                            <option value="">All</option>
                            {Object.entries(KIND_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                        </ClaySelect>
                    </ClayField>
                    <ClayField label="Hospital" htmlFor="f-tenant">
                        <ClaySelect id="f-tenant" value={tenantKey} onChange={(e) => setTenantKey(e.target.value)}>
                            <option value="">All</option>
                            {tenants.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                        </ClaySelect>
                    </ClayField>
                    <ClayField label="Result" htmlFor="f-result">
                        <ClaySelect id="f-result" value={result} onChange={(e) => setResult(e.target.value as '' | 'ok' | 'fail')}>
                            <option value="">All</option>
                            <option value="ok">Success</option>
                            <option value="fail">Failed</option>
                        </ClaySelect>
                    </ClayField>
                    <ClayField label="Date" htmlFor="f-date">
                        <ClayInput id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </ClayField>
                    <ClayField label="Search" htmlFor="f-search">
                        <ClayInput id="f-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bill ID, PID…" />
                    </ClayField>
                </div>
            </ClayCard>

            <ClayCard title="Entries" icon="sparkles" tone="mint" delay={0.05}>
                {visible.length === 0 ? (
                    <p className="text-clay-muted">No entries match.</p>
                ) : (
                    <div className="-mx-2 overflow-x-auto px-2">
                        <table className="clay-table min-w-[680px]">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Type</th>
                                    <th>Details</th>
                                    <th>Hospital</th>
                                    <th>Result</th>
                                    <th><span className="sr-only">Open</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((h) => (
                                    <tr key={h.id}>
                                        <td className="whitespace-nowrap text-clay-muted">{whenText(h.at)}</td>
                                        <td className="whitespace-nowrap font-display font-semibold">{KIND_LABEL[h.kind]}</td>
                                        <td className="max-w-[320px] truncate">{h.summary}</td>
                                        <td className="whitespace-nowrap">{tenantName(h.tenant)}</td>
                                        <td className="whitespace-nowrap">
                                            <span className={`font-semibold ${h.ok ? 'text-mint-deep' : 'text-pink-deep'}`}>
                                                {h.ok ? 'OK' : 'Failed'}{h.status ? ` · ${h.status}` : ''}
                                            </span>
                                        </td>
                                        <td>
                                            <ClayButton tone="ghost" compact type="button" onClick={() => setSelected(h)} aria-label={`Open ${KIND_LABEL[h.kind]} from ${whenText(h.at)}`}>
                                                Open
                                            </ClayButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 ? (
                    <div className="mt-5 flex items-center justify-between gap-3">
                        <ClayButton tone="ghost" compact type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Newer</ClayButton>
                        <span className="text-sm text-clay-muted">Page {page} of {pages}</span>
                        <ClayButton tone="ghost" compact type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Older →</ClayButton>
                    </div>
                ) : null}
            </ClayCard>

            <DetailDrawer entry={selected} tenantName={selected ? tenantName(selected.tenant) : ''} onClose={() => setSelected(null)} />

            <ConfirmDialog
                open={confirmClear}
                title="Clear all history?"
                tone="danger"
                confirmLabel="Clear history"
                onConfirm={() => { clearHistory(); setConfirmClear(false); }}
                onCancel={() => setConfirmClear(false)}
            >
                <p>Deletes all {all.length} entries from this browser. Server data is not affected. Export first if you need a copy.</p>
            </ConfirmDialog>
        </div>
    );
}

function DetailDrawer({ entry, tenantName, onClose }: { entry: HistoryEntry | null; tenantName: string; onClose: () => void }) {
    useEffect(() => {
        if (!entry) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [entry, onClose]);

    const qr = entry?.meta?.qr;
    const isQr = entry?.kind.startsWith('qr-');
    const bill = entry?.kind === 'earn' ? entry.meta?.reference : entry?.kind === 'qr-invoice' ? entry.meta?.bid : undefined;
    const redeemRef = entry?.kind === 'redeem' ? entry.meta?.reference : undefined;

    return (
        <AnimatePresence>
            {entry ? (
                <>
                    <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-clay-ink/35" />
                    <motion.aside
                        key="drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Entry details"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 420, damping: 40 }}
                        className="clay-surface fixed inset-y-0 right-0 z-50 w-full max-w-[460px] overflow-y-auto rounded-l-clay bg-card p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="font-display text-xl font-semibold">{KIND_LABEL[entry.kind]}</h2>
                                <p className="text-sm text-clay-muted">{whenText(entry.at)}</p>
                            </div>
                            <ClayButton tone="ghost" compact type="button" onClick={onClose} autoFocus>Close</ClayButton>
                        </div>

                        <KeyValue
                            rows={[
                                ['Summary', entry.summary],
                                ['Hospital', tenantName],
                                ['Result', <span key="r" className={entry.ok ? 'text-mint-deep' : 'text-pink-deep'}>{entry.ok ? 'Success' : 'Failed'}</span>],
                                ['HTTP', entry.status ?? '-'],
                                ['Time', entry.ms !== null ? `${entry.ms} ms` : '-'],
                            ]}
                        />

                        {isQr && qr ? (
                            <div className="mt-6">
                                <QrPreview value={qr} size={200} filename={`${entry.kind}-${entry.meta?.bid ?? entry.meta?.pid ?? 'qr'}`} />
                            </div>
                        ) : null}

                        <div className="mt-6 flex flex-wrap gap-2.5">
                            {bill || redeemRef ? (
                                <Link
                                    to={`/terminal/bill-cancel?${bill ? `bill=${encodeURIComponent(bill)}` : ''}${redeemRef ? `redemption=${encodeURIComponent(redeemRef)}` : ''}`}
                                    className="clay-pressable rounded-blob bg-pink px-4 py-2 font-display text-sm font-semibold focus-visible:outline-3 focus-visible:outline-lav-deep"
                                >
                                    Cancel this bill…
                                </Link>
                            ) : null}
                            {entry.kind === 'lookup' && entry.meta?.qr ? (
                                <Link to={`/terminal/lookup?qr=${encodeURIComponent(entry.meta.qr)}`} className="clay-pressable rounded-blob bg-lav px-4 py-2 font-display text-sm font-semibold">
                                    Retry lookup
                                </Link>
                            ) : null}
                            {(entry.kind === 'earn' || entry.kind === 'redeem') && entry.meta?.reference ? (
                                <Link
                                    to={`/terminal/points?type=${entry.kind}&reference=${encodeURIComponent(entry.meta.reference)}`}
                                    className="clay-pressable rounded-blob bg-lav px-4 py-2 font-display text-sm font-semibold"
                                >
                                    Retry with same reference
                                </Link>
                            ) : null}
                        </div>

                        <div className="mt-6 space-y-3">
                            <JsonBlock value={entry.request} label="Request" />
                            <JsonBlock value={entry.response} label="Response" />
                        </div>
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>
    );
}
