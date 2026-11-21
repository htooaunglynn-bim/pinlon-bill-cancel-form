import { useCallback, useRef } from 'react';
import { useTenant } from '@/context/TenantContext';
import { addHistory, type HistoryKind } from '@/lib/history';

/** Records a generated QR in history the first time it is copied, downloaded or printed. */
export function useRecordQr() {
    const { tenant } = useTenant();
    const seen = useRef(new Set<string>());

    return useCallback(
        (kind: HistoryKind, qr: string, summary: string, meta: Record<string, string> = {}) => {
            const key = `${kind}|${qr}`;
            if (seen.current.has(key)) return;
            seen.current.add(key);
            addHistory({ tenant: tenant.key, kind, summary, ok: true, status: null, ms: null, request: { qr }, response: null, meta: { qr, ...meta } });
        },
        [tenant.key],
    );
}
