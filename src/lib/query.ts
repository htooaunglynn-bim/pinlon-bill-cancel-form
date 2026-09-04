export type QueryParams = Record<string, string | number | null | undefined>;

/**
 * Builds `path?a=1&b=2`, dropping every empty value.
 *
 * Dropping matters: the log filters are all `nullable` on the backend, but an
 * empty string still reaches the `date` and `in:` rules and fails them with a
 * 422 — so a blank filter has to be absent, not blank.
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
