import type { ApiPayload, ApiResult } from './types';

// Empty in dev so requests hit the Vite proxy (see vite.config.ts) and dodge CORS;
// a production build sets VITE_API_BASE to the full host.
const HOST = import.meta.env.VITE_API_BASE ?? '';

export function fail(payload: ApiPayload, fallback: string): string {
    // Validation failures carry the useful detail in `errors`, not `message`.
    const fieldErrors = Object.values(payload.errors ?? {}).flat();
    if (fieldErrors.length) return fieldErrors.join(' ');

    return payload.message || payload.error_code || fallback;
}

type ApiOptions = {
    method?: string;
    token?: string | null;
    form?: Record<string, string> | null;
    json?: unknown;
};

// `json` sends an application/json body (needed for the nested department_formulas
// array); `form` keeps the original x-www-form-urlencoded path.
export async function api(path: string, { method = 'GET', token = null, form = null, json = null }: ApiOptions & { json?: unknown } = {}): Promise<ApiResult> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    let body: string | URLSearchParams | undefined;
    if (json !== null && json !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(json);
    } else if (form) {
        body = new URLSearchParams(form);
    }

    const response = await fetch(`${HOST}${path}`, { method, headers, body });
    const payload: ApiPayload = await response.json().catch(() => ({}));

    return { status: response.status, ok: payload.success === true, payload };
}
