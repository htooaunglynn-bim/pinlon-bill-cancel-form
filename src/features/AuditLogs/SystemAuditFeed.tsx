import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ClayButton } from '@/components/ClayButton';
import { ClayChip } from '@/components/ClayChip';
import { StatusMessage } from '@/components/StatusMessage';
import { usePagedLogs } from '@/hooks/usePagedLogs';
import {
    DEFAULT_PER_PAGE,
    PER_PAGE_OPTIONS,
    SORT_DIRS,
    SYSTEM_AUDIT_ACTIONS,
    SYSTEM_AUDIT_SORTS,
} from '@/lib/constants';
import type { SystemAuditRow } from '@/lib/types';
import { FilterRow, FilterSelect, FilterText } from './FilterRow';
import { JsonBlock } from './JsonBlock';
import { DetailPair, LogRow } from './LogRow';
import { EmptyState, Pager } from './Pager';
import { whenText } from './format';
import { mapSystemAuditRow } from './mappers';

type Filters = {
    from_date: string;
    to_date: string;
    plgh_code: string;
    customer_name: string;
    action: string;
    performed_name: string;
    q: string;
};

const BLANK: Filters = {
    from_date: '', to_date: '', plgh_code: '', customer_name: '',
    action: '', performed_name: '', q: '',
};

type Props = {
    /** Hands a customer uuid to the Customer history tab. */
    onOpenCustomer: (uuid: string) => void;
};

/** GET /api/v1/staff/reports/system-audit-log — tenant-wide staff actions. */
export function SystemAuditFeed({ onOpenCustomer }: Props) {
    const [draft, setDraft] = useState<Filters>(BLANK);
    const [applied, setApplied] = useState<Filters>(BLANK);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(String(DEFAULT_PER_PAGE));
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    const { rows, meta, status, loading } = usePagedLogs<SystemAuditRow>({
        path: '/api/v1/staff/reports/system-audit-log',
        params: { ...applied, sort_by: sortBy, sort_dir: sortDir, per_page: perPage, page },
        map: mapSystemAuditRow,
        label: 'System audit log',
        forbiddenHint: 'It needs the analytics_report.view permission — log in with an account that has Reports access.',
    });

    const set = (key: keyof Filters) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));

    function apply() {
        setApplied(draft);
        setPage(1);
    }

    function reset() {
        setDraft(BLANK);
        setApplied(BLANK);
        setPage(1);
    }

    return (
        <div>
            <p className="mb-4 text-[15px] text-clay-muted">
                Staff actions taken against customers across the whole tenant. The action list is the
                backend's reportable set — <code>bill_cancel</code> is written to the trail but is not
                one of the filterable actions, so cancels show up only under an unfiltered search.
            </p>

            <FilterRow onApply={apply} onReset={reset} busy={loading}>
                <FilterText label="From date" type="date" value={draft.from_date} onChange={set('from_date')} />
                <FilterText label="To date" type="date" value={draft.to_date} onChange={set('to_date')} />
                <FilterSelect label="Action" value={draft.action} onChange={set('action')} options={SYSTEM_AUDIT_ACTIONS} />
                <FilterText label="PLGH code" placeholder="PLGH-000123" value={draft.plgh_code} onChange={set('plgh_code')} mono />
                <FilterText label="Customer name" value={draft.customer_name} onChange={set('customer_name')} />
                <FilterText label="Performed by" value={draft.performed_name} onChange={set('performed_name')} />
                <FilterText label="Search" hint="(free text)" value={draft.q} onChange={set('q')} />
            </FilterRow>

            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <FilterSelect label="Sort by" value={sortBy} onChange={(value) => { setSortBy(value); setPage(1); }} options={SYSTEM_AUDIT_SORTS} />
                <FilterSelect label="Direction" value={sortDir} onChange={(value) => { setSortDir(value); setPage(1); }} options={SORT_DIRS} />
                <FilterSelect label="Page size" value={perPage} onChange={(value) => { setPerPage(value); setPage(1); }} options={PER_PAGE_OPTIONS} />
            </div>

            <StatusMessage status={status} />

            {rows.length === 0 && !loading && status.state !== 'error' ? (
                <EmptyState>No audit rows for these filters.</EmptyState>
            ) : (
                <ul className="mt-1">
                    <AnimatePresence initial={false}>
                        {rows.map((row) => (
                            <LogRow
                                key={row.uuid}
                                title={row.action_label || row.action}
                                subtitle={`by ${row.performed_by ?? 'system'}`}
                                when={whenText(row.date_time)}
                                chips={
                                    <>
                                        {row.plgh_code ? <ClayChip>{row.plgh_code}</ClayChip> : null}
                                        {row.customer_name ? <ClayChip>{row.customer_name}</ClayChip> : null}
                                        {row.ip_address ? <ClayChip>{row.ip_address}</ClayChip> : null}
                                    </>
                                }
                                detail={
                                    <>
                                        <JsonBlock label="Old values" value={row.old_values} />
                                        <JsonBlock label="New values" value={row.new_values} />
                                        <JsonBlock label="Metadata" value={row.metadata} />
                                        <div className="space-y-1">
                                            <DetailPair label="Action" value={row.action} />
                                            <DetailPair label="Row uuid" value={row.uuid} />
                                            <DetailPair label="Customer uuid" value={row.customer_uuid} />
                                            <DetailPair
                                                label="Reference"
                                                value={row.reference_type ? `${row.reference_type} #${row.reference_id ?? '?'}` : null}
                                            />
                                        </div>
                                        {row.customer_uuid ? (
                                            <ClayButton
                                                type="button" tone="ghost" compact
                                                onClick={() => onOpenCustomer(row.customer_uuid as string)}
                                            >
                                                View this customer's history
                                            </ClayButton>
                                        ) : null}
                                    </>
                                }
                            />
                        ))}
                    </AnimatePresence>
                </ul>
            )}

            <Pager meta={meta} onPage={setPage} busy={loading} />
        </div>
    );
}
