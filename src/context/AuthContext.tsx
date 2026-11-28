import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config, resolveTenantHost, type Tenant } from '@/config/env';
import { posApi } from '@/lib/api';
import { failText } from '@/lib/errors';
import { readSession, writeSession } from '@/lib/storage';

// Sign-in is a tenant id + POS path slug + LPMS token, issued per tenant in the central dashboard.
// The credentials are verified against the tenant's own /health endpoint, so a wrong id, slug or
// token is rejected by bim-lpms itself. The session (token included) lives in sessionStorage only.

type Session = { tenant: Tenant; expiresAt: number };

type LoginResult = { ok: true } | { ok: false; error: string; retryInSeconds?: number };

type AuthValue = {
    /** Signed-in tenant id, or null when signed out. */
    user: string | null;
    tenant: Tenant | null;
    expiresAt: number | null;
    login: (tenantId: string, slug: string, token: string) => Promise<LoginResult>;
    logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

function loadSession(): Session | null {
    const s = readSession<Session | null>('auth', null);
    return s && s.tenant?.token && s.expiresAt > Date.now() ? s : null;
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
        async (tenantId: string, slug: string, token: string): Promise<LoginResult> => {
            const now = Date.now();
            if (lockedUntil > now) {
                return { ok: false, error: 'Too many attempts.', retryInSeconds: Math.ceil((lockedUntil - now) / 1000) };
            }

            const id = tenantId.trim().toLowerCase();
            const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
            const cleanToken = token.trim();

            const fail = (error: string): LoginResult => {
                const count = failures + 1;
                if (count >= MAX_ATTEMPTS) {
                    setFailures(0);
                    setLockedUntil(Date.now() + COOLDOWN_MS);
                    return { ok: false, error: 'Too many attempts.', retryInSeconds: COOLDOWN_MS / 1000 };
                }
                setFailures(count);
                return { ok: false, error: `${error} ${MAX_ATTEMPTS - count} attempt(s) left.` };
            };

            const resolved = resolveTenantHost(id);
            if (!resolved) return fail(`Unknown tenant id "${id}".`);

            const tenant: Tenant = { key: id, name: resolved.name, host: resolved.host, slug: cleanSlug, token: cleanToken };
            const result = await posApi(tenant, '/health');
            if (!result.ok) {
                if (result.networkError) return { ok: false, error: result.networkError };
                if (result.status === 404) return fail('Wrong slug for this tenant.');
                if (result.status === 401 || result.status === 403) return fail('The token was rejected.');
                return { ok: false, error: failText(result, 'Sign-in check failed.') };
            }

            const next: Session = { tenant, expiresAt: Date.now() + config.sessionHours * 3_600_000 };
            writeSession('auth', next);
            setSession(next);
            setFailures(0);
            return { ok: true };
        },
        [failures, lockedUntil],
    );

    const value = useMemo<AuthValue>(
        () => ({ user: session?.tenant.key ?? null, tenant: session?.tenant ?? null, expiresAt: session?.expiresAt ?? null, login, logout }),
        [session, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
