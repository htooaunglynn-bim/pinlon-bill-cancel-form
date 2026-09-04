import { useState } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { useSession } from '@/context/SessionContext';
import { StaffGate } from '@/features/StaffFormulas/StaffGate';
import { ChangeLogFeed } from './ChangeLogFeed';
import { CustomerHistoryFeed } from './CustomerHistoryFeed';
import { SystemAuditFeed } from './SystemAuditFeed';

type Tab = 'system' | 'customer' | 'changes';

const TABS: ReadonlyArray<readonly [Tab, string]> = [
    ['system', 'System audit log'],
    ['customer', 'Customer history'],
    ['changes', 'Change log'],
];

/**
 * The four staff-plane audit feeds behind one card.
 *
 * Tabs are local state rather than nested routes: each tab owns a filter set and
 * a page number, and there is nothing to deep-link to. If that changes, `?tab=`
 * via useSearchParams is the cheap upgrade — the route table stays as it is.
 */
export function AuditLogs() {
    const { staffToken } = useSession();
    const [tab, setTab] = useState<Tab>('system');
    const [drillUuid, setDrillUuid] = useState<string | null>(null);

    function openCustomer(uuid: string) {
        setDrillUuid(uuid);
        setTab('customer');
    }

    return (
        <ClayCard
            title="Audit & Activity Logs"
            icon="preview"
            tone="mint"
            delay={0.05}
            intro={
                <>
                    <p>
                        Read-only views over the backend's two trails: <code>audits</code> (what changed
                        on a record) and <code>activity_log</code> (what was done). Use them to confirm
                        that an earn, a bill cancel, or a settings edit actually wrote what you expect.
                    </p>
                    <p>
                        Each feed has its own gate, so a token can see one tab and not another:
                        the system audit log needs the <strong>analytics_report.view</strong> permission,
                        the change log is <strong>admin-only</strong>, and customer history needs
                        <strong> customer.view</strong>. A missing permission shows as a "not allowed"
                        message rather than an empty list.
                    </p>
                </>
            }
        >
            {!staffToken ? (
                <StaffGate note="Every log feed reads through a staff token. Log in, then come back here." />
            ) : (
                <>
                    <div role="tablist" aria-label="Log feeds" className="flex flex-wrap gap-2.5">
                        {TABS.map(([value, label]) => (
                            <ClayButton
                                key={value}
                                type="button"
                                compact
                                role="tab"
                                aria-selected={tab === value}
                                aria-controls="audit-panel"
                                tone={tab === value ? 'primary' : 'ghost'}
                                onClick={() => setTab(value)}
                            >
                                {label}
                            </ClayButton>
                        ))}
                    </div>

                    <div id="audit-panel" role="tabpanel" className="mt-6">
                        {tab === 'system' ? <SystemAuditFeed onOpenCustomer={openCustomer} /> : null}
                        {tab === 'customer' ? <CustomerHistoryFeed initialCustomerUuid={drillUuid} /> : null}
                        {tab === 'changes' ? <ChangeLogFeed /> : null}
                    </div>
                </>
            )}
        </ClayCard>
    );
}
