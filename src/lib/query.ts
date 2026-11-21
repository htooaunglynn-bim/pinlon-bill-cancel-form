export type QueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Builds `path?a=1&b=2`, dropping every empty value.
 *
 * Dropping matters: optional fields are `nullable` on the backend, but an empty string still
 * reaches rules like `integer` and fails them with a 422. A blank value has to be left out.
 */
export function withQuery(path: string, params: QueryParams): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) continue;
        const text = String(value).trim();
        if (text === '') continue;
        search.set(key, text);
    }

    const query = search.toString();
    return query ? `${path}?${query}` : path;
}

/** Same rule for JSON bodies: drop blank optional fields instead of sending "". */
export function compact<T extends Record<string, unknown>>(body: T): Partial<T> {
    const out: Partial<T> = {};
    for (const [key, value] of Object.entries(body)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'string' && value.trim() === '') continue;
        (out as Record<string, unknown>)[key] = typeof value === 'string' ? value.trim() : value;
    }
    return out;
}
