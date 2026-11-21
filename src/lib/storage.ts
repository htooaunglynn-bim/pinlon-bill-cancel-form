// Browser storage helpers. Every access is guarded: private windows, blocked site data and
// embedded previews can make the storage accessor itself throw, and the dashboard must still
// work (just without persistence) when that happens.

const PREFIX = 'pinlon-pos:';

function store(kind: 'session' | 'local'): Storage | null {
    try {
        return kind === 'session' ? window.sessionStorage : window.localStorage;
    } catch {
        return null;
    }
}

function read<T>(kind: 'session' | 'local', key: string, fallback: T): T {
    try {
        const raw = store(kind)?.getItem(PREFIX + key);
        return raw === null || raw === undefined ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

function write(kind: 'session' | 'local', key: string, value: unknown): void {
    try {
        const s = store(kind);
        if (!s) return;
        if (value === null || value === undefined) s.removeItem(PREFIX + key);
        else s.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // Persistence is a convenience, never a requirement (quota, privacy mode).
    }
}

export const readSession = <T,>(key: string, fallback: T) => read('session', key, fallback);
export const writeSession = (key: string, value: unknown) => write('session', key, value);
export const readLocal = <T,>(key: string, fallback: T) => read('local', key, fallback);
export const writeLocal = (key: string, value: unknown) => write('local', key, value);
