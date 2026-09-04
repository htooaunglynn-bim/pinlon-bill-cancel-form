import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ClayChip } from '@/components/ClayChip';
import { StatusMessage } from '@/components/StatusMessage';
import { usePagedLogs } from '@/hooks/usePagedLogs';
import {
    CHANGE_LOG_SORTS,
    CHANGE_LOG_SOURCES,
    DEFAULT_PER_PAGE,
    PER_PAGE_OPTIONS,
    SORT_DIRS,
} from '@/lib/constants';
import type { ChangeLogRow } from '@/lib/types';
import { FilterRow, FilterSelect, FilterText } from './FilterRow';
import { JsonBlock, parseMaybeJson } from './JsonBlock';
import { DetailPair, LogRow } from './LogRow';
import { EmptyState, Pager } from './Pager';
import { shortJson, whenText } from './format';
import { mapChangeLogRow } from './mappers';

type Filters = {
    source: string;
    subject: string;
    field: string;
    actor_name: string;
    actor_role: string;
    actor_source: string;
    reason: string;
    q: string;
    from_date: string;
    to_date: string;
};

const BLANK: Filters = {
    source: '', subject: '', field: '', actor_name: '', actor_role: '',
    actor_source: '', reason: '', q: '', from_date: '', to_date: '',
};

/** GET /api/v1/staff/logs — tier and setting field changes. Admin only. */
export function ChangeLogFeed() {
    const [draft, setDraft] = useState<Filters>(BLANK);
    const [applied, setApplied] = useState<Filters>(BLANK);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(String(DEFAULT_PER_PAGE));
    const [sortBy, setSortBy] = useState('date_time');
    const [sortDir, setSortDir] = useState('desc');

    const { rows, meta, status, loading } = usePagedLogs<ChangeLogRow>({
        path: '/api/v1/staff/logs',
        params: { ...applied, sort_by: sortBy, sort_dir: sortDir, per_page: perPage, page },
        map: mapChangeLogRow,
        label: 'Change log',
        forbiddenHint: 'It is admin-only — log in with an admin staff account.',
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
                Field-level changes to <strong>tiers and settings</strong> only. This is a change log,
                not a tamper-evident audit trail — a setting's history can be cleared, and deleting a
                tier deletes its trail with it.
            </p>

            <FilterRow onApply={apply} onReset={reset} busy={loading}>
                <FilterSelect label="Source" value={draft.source} onChange={set('source')} options={CHANGE_LOG_SOURCES} />
                <FilterText label="Subject" placeholder="e.g. points.earn_rate" value={draft.subject} onChange={set('subject')} mono />
                <FilterText label="Field" placeholder="e.g. value" value={draft.field} onChange={set('field')} mono />
                <FilterText label="Actor name" value={draft.actor_name} onChange={set('actor_name')} />
                <FilterText label="Actor role" value={draft.actor_role} onChange={set('actor_role')} />
                <FilterText label="Actor source" value={draft.actor_source} onChange={set('actor_source')} />
                <FilterText label="Reason" value={draft.reason} onChange={set('reason')} />
                <FilterText label="Search" hint="(free text)" value={draft.q} onChange={set('q')} />
                <div />
                <FilterText label="From date" type="date" value={draft.from_date} onChange={set('from_date')} />
                <FilterText label="To date" type="date" value={draft.to_date} onChange={set('to_date')} />
            </FilterRow>

            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <FilterSelect label="Sort by" value={sortBy} onChange={(value) => { setSortBy(value); setPage(1); }} options={CHANGE_LOG_SORTS} />
                <FilterSelect label="Direction" value={sortDir} onChange={(value) => { setSortDir(value); setPage(1); }} options={SORT_DIRS} />
                <FilterSelect label="Page size" value={perPage} onChange={(value) => { setPerPage(value); setPage(1); }} options={PER_PAGE_OPTIONS} />
            </div>

            <StatusMessage status={status} />

            {rows.length === 0 && !loading && status.state !== 'error' ? (
                <EmptyState>Nothing to show. Save a change on Formulas &amp; Preview, then apply again.</EmptyState>
            ) : (
                <ul className="mt-1">
                    <AnimatePresence initial={false}>
                        {rows.map((row) => (
                            // `id` is a row number across the result set, so it is not stable
                            // across pages or sorts — the composite is.
                            <LogRow
                                key={`${row.source}-${row.subject_id}-${row.field}-${row.date_time}`}
                                title={`${row.subject}${row.field ? ` · ${row.field}` : ''}`}
                                subtitle={`${row.actor_name ?? 'system'}${row.actor_role ? ` (${row.actor_role})` : ''} — ${shortJson(row.from)} → ${shortJson(row.to)}`}
                                when={whenText(row.date_time)}
                                chips={
                                    <>
                                        {row.source ? <ClayChip>{row.source}</ClayChip> : null}
                                        {row.actor_source ? <ClayChip>{row.actor_source}</ClayChip> : null}
                                    </>
                                }
                                detail={
                                    <>
                                        <JsonBlock label="From" value={parseMaybeJson(row.from)} />
                                        <JsonBlock label="To" value={parseMaybeJson(row.to)} />
                                        <div className="space-y-1">
                                            <DetailPair label="Subject id" value={row.subject_id} />
                                            <DetailPair label="Reason" value={row.reason} />
                                            <DetailPair label="Actor email" value={row.actor_email} />
                                            <DetailPair label="Actor phone" value={row.actor_phone} />
                                        </div>
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
