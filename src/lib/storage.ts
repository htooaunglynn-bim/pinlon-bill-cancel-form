// Session persistence. Every access is guarded: private windows, blocked site data and
// some embedded contexts make the sessionStorage accessor itself throw, and the harness
// must still work (just without persistence) when that happens.

const PREFIX = 'pinlon-harness:';

export function readSession<T>(key: string, fallback: T): T {
    try {
        const raw = sessionStorage.getItem(PREFIX + key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

export function writeSession(key: string, value: unknown): void {
    try {
        if (value === null || value === undefined) sessionStorage.removeItem(PREFIX + key);
        else sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // Persistence is a convenience, never a requirement.
    }
}
