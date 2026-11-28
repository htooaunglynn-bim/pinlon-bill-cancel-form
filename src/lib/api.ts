import type { Tenant } from '@/config/env';
import { addHistory, type HistoryKind } from './history';
import { withQuery, type QueryParams } from './query';
import type { ApiPayload, ApiResult } from './types';

const CUSTOMER_BASE = '/api/v1/customer';

/** Body fields that must never reach history (OTP codes). Tokens are never in the body at all. */
const MASKED_FIELDS = ['code'];

type LogOptions = { kind: HistoryKind; summary: string; meta?: Record<string, string> };

type RequestOptions = {
    method?: 'GET' | 'POST';
    query?: QueryParams;
    json?: Record<string, unknown>;
    /** Bearer token for this call. Never written to history. */
    token?: string | null;
    /** When set, the call is written to activity history. */
    log?: LogOptions;
};

function maskBody(body: Record<string, unknown> | undefined): Record<string, unknown> | null {
    if (!body) return null;
    const out: Record<string, unknown> = { ...body };
    for (const field of MASKED_FIELDS) if (field in out) out[field] = '••••••';
    return out;
}

/** Strips secrets (access tokens) out of a response before it is stored in history. */
function maskResponse(payload: ApiPayload<unknown>): unknown {
    const data = payload.data;
    if (data && typeof data === 'object' && 'access_token' in (data as Record<string, unknown>)) {
        return { ...payload, data: { ...(data as Record<string, unknown>), access_token: '••••••' } };
    }
    return payload;
}

/**
 * Shared fetch for every bim-lpms call: timing, envelope parsing and history.
 * Never throws: network failures come back as `{ ok: false, networkError }`.
 */
async function request<T>(tenant: Tenant, base: string, path: string, options: RequestOptions): Promise<ApiResult<T>> {
    const { method = 'GET', query = {}, json, token, log } = options;
    const url = tenant.host + withQuery(base + path, query);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
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
            request: { method, path: base + path, query, body: maskBody(json) },
            response: result.networkError ? { error: result.networkError } : maskResponse(result.payload),
            meta: log.meta,
        });
    }

    return result;
}

type PosOptions = Omit<RequestOptions, 'token'>;

/** Calls one POS endpoint at /api/v1/public/{slug} on the tenant host with that tenant's LPMS token. */
export function posApi<T = unknown>(tenant: Tenant, path: string, options: PosOptions = {}): Promise<ApiResult<T>> {
    return request<T>(tenant, `/api/v1/public/${encodeURIComponent(tenant.slug)}`, path, { ...options, token: tenant.token });
}

/** Calls one customer (mobile app) endpoint on the tenant host, optionally as a signed-in customer. */
export function customerApi<T = unknown>(tenant: Tenant, path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
    return request<T>(tenant, CUSTOMER_BASE, path, options);
}
