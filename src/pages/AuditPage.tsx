import { AuditLogs } from '@/features/AuditLogs';

export function AuditPage() {
    // Wider than the 760px form pages: the filter grid wants three columns at xl.
    return (
        <div className="max-w-[980px]">
            <AuditLogs />
        </div>
    );
}
