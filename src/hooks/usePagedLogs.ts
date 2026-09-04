import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useStatus } from '@/hooks/useStatus';
import type { Status } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';
import { withQuery } from '@/lib/query';
import type { QueryParams } from '@/lib/query';
import type { PageMeta } from '@/lib/types';
import { mapMeta } from '@/features/AuditLogs/mappers';

type Options<Row> = {
    /** Endpoint without a query string, or null to stay idle (no token, no customer yet). */
    path: string | null;
    params: QueryParams;
    /** Every feed returns loose JSON; narrow it here, once. */
    map: (raw: any) => Row;
    /** Human name for this feed, used in every status line. */
    label: string;
    /** Appended to the 403 message, e.g. which permission is missing. */
    forbiddenHint?: string;
};

type Result<Row> = {
    rows: Row[];
    meta: PageMeta | null;
    status: Status;
    loading: boolean;
    reload: () => void;
};

/**
 * One paginated log feed: fetch, page meta, and a status line.
 *
 * Errors branch on the HTTP status before the body, because a Laravel 403 or 401
 * does not necessarily carry `success`/`message` — driving the copy off `status`
 * is what keeps "you lack the permission" from reading as "there are no rows".
 */
export function usePagedLogs<Row>({ path, params, map, label, forbiddenHint }: Options<Row>): Result<Row> {
    const { staffToken } = useSession();
    const { status, say } = useStatus();
    const [rows, setRows] = useState<Row[]>([]);
    const [meta, setMeta] = useState<PageMeta | null>(null);
    const [loading, setLoading] = useState(false);
    const [nonce, setNonce] = useState(0);

    const reload = useCallback(() => setNonce((current) => current + 1), []);

    // Callers rebuild `params` every render, so the effect keys off its serialisation
    // rather than the object identity — otherwise every render refetches.
    const key = JSON.stringify(params);

    // Kept in a ref so a new mapper identity each render doesn't retrigger the fetch.
    const mapRef = useRef(map);
    mapRef.current = map;

    useEffect(() => {
        if (!path || !staffToken) {
            setRows([]);
            setMeta(null);
            say('');
            return;
        }

        let cancelled = false;
        setLoading(true);
        say(`Loading ${label.toLowerCase()}…`, 'busy');

        api(withQuery(path, JSON.parse(key) as QueryParams), { token: staffToken })
            .then(({ ok, status: httpStatus, payload }) => {
                if (cancelled) return;

                if (!ok) {
                    setRows([]);
                    setMeta(null);
                    say(errorText(httpStatus, payload, label, forbiddenHint), 'error');
                    return;
                }

                const entries: any[] = Array.isArray(payload.data) ? payload.data : [];
                const pageMeta = mapMeta((payload as any).meta);

                setRows(entries.map((entry) => mapRef.current(entry)));
                setMeta(pageMeta);
                say(
                    entries.length === 0
                        ? 'No rows match these filters.'
                        : `${label}: ${pageMeta?.total ?? entries.length} row(s).`,
                    'success',
                );
            })
            .catch(() => {
                if (cancelled) return;
                setRows([]);
                setMeta(null);
                say('Network error — is the dev server proxy up?', 'error');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [path, key, staffToken, nonce, label, forbiddenHint, say]);

    return { rows, meta, status, loading, reload };
}

function errorText(httpStatus: number, payload: any, label: string, forbiddenHint?: string): string {
    if (httpStatus === 401) return 'Staff token rejected — log in again on Staff Login.';
    if (httpStatus === 403) return `Not allowed: ${label} is restricted. ${forbiddenHint ?? ''}`.trim();
    if (httpStatus === 404) return 'Not found — check the customer uuid.';
    if (httpStatus === 422) return fail(payload, 'A filter was rejected.');

    return fail(payload, `${label} failed to load.`);
}
