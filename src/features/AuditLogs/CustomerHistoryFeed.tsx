import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ClayButton } from '@/components/ClayButton';
import { ClayChip } from '@/components/ClayChip';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { StatusMessage } from '@/components/StatusMessage';
import { usePagedLogs } from '@/hooks/usePagedLogs';
import { CUSTOMER_AUDIT_ACTIONS, DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '@/lib/constants';
import type { CustomerAuditRow, TimelineRow } from '@/lib/types';
import { FilterRow, FilterSelect, FilterText } from './FilterRow';
import { JsonBlock } from './JsonBlock';
import { DetailPair, LogRow } from './LogRow';
import { EmptyState, Pager } from './Pager';
import { whenText } from './format';
import { mapCustomerAuditRow, mapTimelineRow } from './mappers';
import { useCustomerLookup } from './useCustomerLookup';

type Mode = 'timeline' | 'actions';

type Props = {
    /** A uuid handed over from the System audit log tab's drill-down. */
    initialCustomerUuid?: string | null;
};

/**
 * One customer's history, from either of the two per-customer feeds.
 *
 * The timeline is the merged view (audits + activity_log); "staff actions only"
 * is the narrower feed, kept because it is the only one carrying performed_id
 * and the reference pointer.
 */
export function CustomerHistoryFeed({ initialCustomerUuid = null }: Props) {
    const lookup = useCustomerLookup();
    const [input, setInput] = useState(initialCustomerUuid ?? '');
    const [mode, setMode] = useState<Mode>('timeline');

    // Timeline filters: the controller reads only these. Rendering a sort or a
    // free-text box here would be a control that silently does nothing.
    const [timelineDraft, setTimelineDraft] = useState({ from_date: '', to_date: '' });
    const [timelineApplied, setTimelineApplied] = useState({ from_date: '', to_date: '' });

    // The narrow feed names its dates `from`/`to`, not `from_date`/`to_date`.
    const [actionsDraft, setActionsDraft] = useState({ from: '', to: '', action: '' });
    const [actionsApplied, setActionsApplied] = useState({ from: '', to: '', action: '' });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(String(DEFAULT_PER_PAGE));

    const { uuid, customer, candidates, resolve, choose, clear } = lookup;

    useEffect(() => {
        if (initialCustomerUuid) {
            setInput(initialCustomerUuid);
            void resolve(initialCustomerUuid);
        }
    }, [initialCustomerUuid, resolve]);

    // Only the active mode gets a path; the other stays idle, so one request flies.
    const timeline = usePagedLogs<TimelineRow>({
        path: uuid && mode === 'timeline' ? `/api/v1/staff/customers/${uuid}/timeline` : null,
        params: { ...timelineApplied, per_page: perPage, page },
        map: mapTimelineRow,
        label: 'Customer timeline',
        forbiddenHint: 'It needs the customer.view permission.',
    });

    const actions = usePagedLogs<CustomerAuditRow>({
        path: uuid && mode === 'actions' ? `/api/v1/staff/customers/${uuid}/audit-logs` : null,
        params: { ...actionsApplied, per_page: perPage, page },
        map: mapCustomerAuditRow,
        label: 'Staff actions',
        forbiddenHint: 'It needs the customer.view permission.',
    });

    const feed = mode === 'timeline' ? timeline : actions;

    function switchMode(next: Mode) {
        setMode(next);
        setPage(1);
    }

    function applyTimeline() {
        setTimelineApplied(timelineDraft);
        setPage(1);
    }

    function applyActions() {
        setActionsApplied(actionsDraft);
        setPage(1);
    }

    return (
        <div>
            <p className="mb-4 text-[15px] text-clay-muted">
                Everything recorded about one customer: field changes from <code>audits</code> and
                actions from <code>activity_log</code>, merged and newest first. Enter their PID
                (PLGH code) or paste a customer uuid.
            </p>

            <div className="clay-inset rounded-clay bg-cream/70 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <ClayField label="PID or customer uuid" htmlFor="audit-customer" className="flex-1">
                        <ClayInput
                            id="audit-customer" type="text" autoComplete="off" mono
                            placeholder="PLGH-000123"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    void resolve(input);
                                }
                            }}
                        />
                    </ClayField>
                    <div className="flex shrink-0 gap-2.5">
                        <ClayButton type="button" tone="secondary" compact disabled={lookup.busy} onClick={() => void resolve(input)}>
                            Find
                        </ClayButton>
                        {uuid ? (
                            <ClayButton type="button" tone="ghost" compact onClick={() => { clear(); setInput(''); setPage(1); }}>
                                Change customer
                            </ClayButton>
                        ) : null}
                    </div>
                </div>

                <StatusMessage status={lookup.status} />

                {candidates.length > 0 ? (
                    <ul className="mt-1">
                        {candidates.map((hit) => (
                            <li key={hit.uuid} className="clay-inset mt-3 flex items-center gap-3 rounded-blob bg-card px-4 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-display text-[15px] font-semibold">{hit.name}</p>
                                    <p className="font-mono text-xs text-clay-muted">
                                        {hit.member_code}{hit.phone ? ` · ${hit.phone}` : ''}
                                    </p>
                                </div>
                                <ClayButton type="button" tone="ghost" compact onClick={() => choose(hit)}>Select</ClayButton>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {uuid ? (
                    <p className="mt-3 font-mono text-xs break-all text-clay-muted">
                        {customer ? `${customer.name} · ${customer.member_code} · ` : ''}{uuid}
                    </p>
                ) : null}
            </div>

            {!uuid ? (
                <EmptyState>Find a customer to see their history.</EmptyState>
            ) : (
                <>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <ClayButton type="button" compact tone={mode === 'timeline' ? 'primary' : 'ghost'} onClick={() => switchMode('timeline')}>
                            Timeline (merged)
                        </ClayButton>
                        <ClayButton type="button" compact tone={mode === 'actions' ? 'primary' : 'ghost'} onClick={() => switchMode('actions')}>
                            Staff actions only
                        </ClayButton>
                    </div>

                    <div className="mt-4">
                        {mode === 'timeline' ? (
                            <FilterRow
                                onApply={applyTimeline}
                                onReset={() => { setTimelineDraft({ from_date: '', to_date: '' }); setTimelineApplied({ from_date: '', to_date: '' }); setPage(1); }}
                                busy={timeline.loading}
                            >
                                <FilterText
                                    label="From date" type="date" value={timelineDraft.from_date}
                                    onChange={(value) => setTimelineDraft((current) => ({ ...current, from_date: value }))}
                                />
                                <FilterText
                                    label="To date" type="date" value={timelineDraft.to_date}
                                    onChange={(value) => setTimelineDraft((current) => ({ ...current, to_date: value }))}
                                />
                                <FilterSelect label="Page size" value={perPage} onChange={(value) => { setPerPage(value); setPage(1); }} options={PER_PAGE_OPTIONS} />
                            </FilterRow>
                        ) : (
                            <FilterRow
                                onApply={applyActions}
                                onReset={() => { setActionsDraft({ from: '', to: '', action: '' }); setActionsApplied({ from: '', to: '', action: '' }); setPage(1); }}
                                busy={actions.loading}
                            >
                                <FilterText
                                    label="From date" type="date" value={actionsDraft.from}
                                    onChange={(value) => setActionsDraft((current) => ({ ...current, from: value }))}
                                />
                                <FilterText
                                    label="To date" type="date" value={actionsDraft.to}
                                    onChange={(value) => setActionsDraft((current) => ({ ...current, to: value }))}
                                />
                                <FilterSelect
                                    label="Action" hint="(only these two are accepted)" value={actionsDraft.action}
                                    onChange={(value) => setActionsDraft((current) => ({ ...current, action: value }))}
                                    options={CUSTOMER_AUDIT_ACTIONS}
                                />
                                <FilterSelect label="Page size" value={perPage} onChange={(value) => { setPerPage(value); setPage(1); }} options={PER_PAGE_OPTIONS} />
                            </FilterRow>
                        )}
                    </div>

                    <p className="mt-3 text-sm text-clay-muted italic">
                        {mode === 'timeline'
                            ? 'Newest first, and capped at 1000 rows per source before merging — on very long histories the deepest pages are incomplete by design.'
                            : 'Staff actions against this customer only. The action filter matches the stored event, while the label comes from the row itself, so an odd writer could make the two disagree.'}
                    </p>

                    <StatusMessage status={feed.status} />

                    {mode === 'timeline' ? (
                        timeline.rows.length === 0 && !timeline.loading && timeline.status.state !== 'error' ? (
                            <EmptyState>No history in this window.</EmptyState>
                        ) : (
                            <ul className="mt-1">
                                <AnimatePresence initial={false}>
                                    {timeline.rows.map((row) => (
                                        // `id` is the source table's PK, and the two sources number
                                        // independently — the kind has to be part of the key.
                                        <LogRow
                                            key={`${row.kind}-${row.id}`}
                                            title={row.event ?? '(no event)'}
                                            subtitle={row.actor_name ?? 'system'}
                                            when={whenText(row.at)}
                                            chips={
                                                <>
                                                    <span className={`clay-inset inline-flex items-center rounded-full px-3.5 py-1.5 font-mono text-xs text-clay-ink ${row.kind === 'change' ? 'bg-lav' : 'bg-mint'}`}>
                                                        {row.kind}
                                                    </span>
                                                    {row.subject_type ?? row.log_name ? <ClayChip>{row.subject_type ?? row.log_name}</ClayChip> : null}
                                                    {row.actor_role ? <ClayChip>{row.actor_role}</ClayChip> : null}
                                                    {row.actor_source ? <ClayChip>{row.actor_source}</ClayChip> : null}
                                                </>
                                            }
                                            detail={
                                                <>
                                                    <JsonBlock label="Old" value={row.old} />
                                                    <JsonBlock label="New" value={row.new} />
                                                    <div className="space-y-1">
                                                        <DetailPair label="Source" value={row.kind === 'change' ? 'audits' : 'activity_log'} />
                                                        <DetailPair label="Source row id" value={row.id} />
                                                        <DetailPair label="Reason" value={row.reason} />
                                                    </div>
                                                </>
                                            }
                                        />
                                    ))}
                                </AnimatePresence>
                            </ul>
                        )
                    ) : actions.rows.length === 0 && !actions.loading && actions.status.state !== 'error' ? (
                        <EmptyState>No staff actions recorded against this customer.</EmptyState>
                    ) : (
                        <ul className="mt-1">
                            <AnimatePresence initial={false}>
                                {actions.rows.map((row) => (
                                    <LogRow
                                        key={row.uuid}
                                        title={row.action}
                                        subtitle={`by ${row.performed_name ?? 'system'}`}
                                        when={whenText(row.created_at)}
                                        chips={row.ip_address ? <ClayChip>{row.ip_address}</ClayChip> : null}
                                        detail={
                                            <>
                                                <JsonBlock label="Old values" value={row.old_values} />
                                                <JsonBlock label="New values" value={row.new_values} />
                                                <JsonBlock label="Metadata" value={row.metadata} />
                                                <div className="space-y-1">
                                                    <DetailPair label="Row uuid" value={row.uuid} />
                                                    <DetailPair label="Performed id" value={row.performed_id} />
                                                    <DetailPair
                                                        label="Reference"
                                                        value={row.reference_type ? `${row.reference_type} #${row.reference_id ?? '?'}` : null}
                                                    />
                                                </div>
                                            </>
                                        }
                                    />
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}

                    <Pager meta={feed.meta} onPage={setPage} busy={feed.loading} />
                </>
            )}
        </div>
    );
}
