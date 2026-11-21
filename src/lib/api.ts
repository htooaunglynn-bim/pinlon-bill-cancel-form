import { config, type Tenant } from '@/config/env';
import { addHistory, type HistoryKind } from './history';
import { withQuery, type QueryParams } from './query';
import type { ApiPayload, ApiResult } from './types';

const BASE = '/api/v1/public/pos';

type PosOptions = {
    method?: 'GET' | 'POST';
    query?: QueryParams;
    json?: Record<string, unknown>;
    /** When set, the call is written to activity history. */
    log?: { kind: HistoryKind; summary: string; meta?: Record<string, string> };
};

/**
 * Calls one POS endpoint on the given tenant host with the shared bearer token.
 * Never throws: network failures come back as `{ ok: false, networkError }`.
 */
export async function posApi<T = unknown>(tenant: Tenant, path: string, options: PosOptions = {}): Promise<ApiResult<T>> {
    const { method = 'GET', query = {}, json, log } = options;
    const url = tenant.host + withQuery(BASE + path, query);

    const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${config.posToken}`,
    };
    if (json) headers['Content-Type'] = 'application/json';

    const started = performance.now();
    let result: ApiResult<T>;

    try {
        const response = await fetch(url, { method, headers, body: json ? JSON.stringify(json) : undefined });
        const payload: ApiPayload<T> = await response.json().catch(() => ({}));
        result = { status: response.status, ok: response.ok && payload.success === true, payload, ms: Math.round(performance.now() - started) };
    } catch (error) {
        result = {
            status: 0,
            ok: false,
            payload: {},
            ms: Math.round(performance.now() - started),
            networkError: `Could not reach ${tenant.host} (${error instanceof Error ? error.message : 'network error'}).`,
        };
    }

    if (log) {
        addHistory({
            tenant: tenant.key,
            kind: log.kind,
            summary: log.summary,
            ok: result.ok,
            status: result.status,
            ms: result.ms,
            // The token is never stored; only the endpoint and body.
            request: { method, path: BASE + path, query, body: json ?? null },
            response: result.networkError ? { error: result.networkError } : result.payload,
            meta: log.meta,
        });
    }

    return result;
}
