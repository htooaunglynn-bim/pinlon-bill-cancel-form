import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config } from '@/config/env';
import { readSession, writeSession } from '@/lib/storage';

// Sign-in checks against VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD. Those values ship in the
// bundle, so this is a convenience gate for an internal tool, not real security. The README
// says to protect the deployed site at the hosting layer.

type Session = { user: string; expiresAt: number };

type LoginResult = { ok: true } | { ok: false; error: string; retryInSeconds?: number };

type AuthValue = {
    user: string | null;
    expiresAt: number | null;
    login: (username: string, password: string) => LoginResult;
    logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

function loadSession(): Session | null {
    const s = readSession<Session | null>('auth', null);
    return s && s.expiresAt > Date.now() ? s : null;
}

/** Constant-time-ish comparison so the check doesn't short-circuit on the first wrong char. */
function same(a: string, b: string): boolean {
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(loadSession);
    const [failures, setFailures] = useState(0);
    const [lockedUntil, setLockedUntil] = useState(0);

    const logout = useCallback(() => {
        writeSession('auth', null);
        setSession(null);
    }, []);

    // Expire the session in place, without waiting for the next navigation.
    useEffect(() => {
        if (!session) return;
        const timer = window.setTimeout(logout, Math.max(0, session.expiresAt - Date.now()));
        return () => window.clearTimeout(timer);
    }, [session, logout]);

    const login = useCallback(
        (username: string, password: string): LoginResult => {
            const now = Date.now();
            if (lockedUntil > now) {
                return { ok: false, error: 'Too many attempts.', retryInSeconds: Math.ceil((lockedUntil - now) / 1000) };
            }

            if (same(username.trim(), config.adminUsername) && same(password, config.adminPassword)) {
                const next = { user: config.adminUsername, expiresAt: now + config.sessionHours * 3_600_000 };
                writeSession('auth', next);
                setSession(next);
                setFailures(0);
                return { ok: true };
            }

            const count = failures + 1;
            if (count >= MAX_ATTEMPTS) {
                setFailures(0);
                setLockedUntil(now + COOLDOWN_MS);
                return { ok: false, error: 'Too many attempts.', retryInSeconds: COOLDOWN_MS / 1000 };
            }
            setFailures(count);
            return { ok: false, error: `Wrong username or password. ${MAX_ATTEMPTS - count} attempt(s) left.` };
        },
        [failures, lockedUntil],
    );

    const value = useMemo<AuthValue>(
        () => ({ user: session?.user ?? null, expiresAt: session?.expiresAt ?? null, login, logout }),
        [session, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
