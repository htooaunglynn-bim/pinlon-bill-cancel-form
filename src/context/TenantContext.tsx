import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Tenant } from '@/config/env';
import { useAuth } from '@/context/AuthContext';
import { posApi } from '@/lib/api';
import { failText } from '@/lib/errors';
import type { HealthResult } from '@/lib/types';

export type Health = {
    state: 'unknown' | 'checking' | 'ok' | 'error';
    checkedAt?: string;
    ms?: number;
    message?: string;
    status?: number;
};

type TenantValue = {
    tenants: Tenant[];
    tenant: Tenant;
    health: Record<string, Health>;
    checkHealth: (tenant?: Tenant, logIt?: boolean) => Promise<void>;
};

const TenantContext = createContext<TenantValue | null>(null);
const POLL_MS = 60_000;
const SIGNED_OUT: Tenant = { key: '', name: '', host: '', slug: '', token: '' };

export function TenantProvider({ children }: { children: ReactNode }) {
    const { user, tenant: signedIn } = useAuth();
    // Signed out there is no tenant; the placeholder keeps hooks simple and is never called with.
    const tenant = signedIn ?? SIGNED_OUT;
    const tenants = useMemo(() => (signedIn ? [signedIn] : []), [signedIn]);
    const [health, setHealth] = useState<Record<string, Health>>({});
    const busy = useRef(new Set<string>());

    const checkHealth = useCallback(async (target?: Tenant, logIt = false) => {
        const t = target ?? tenant;
        if (busy.current.has(t.key)) return;
        busy.current.add(t.key);
        setHealth((h) => ({ ...h, [t.key]: { ...h[t.key], state: 'checking' } }));

        const result = await posApi<HealthResult>(t, '/health', logIt ? { log: { kind: 'health', summary: `Health check: ${t.name}` } } : {});
        busy.current.delete(t.key);
        setHealth((h) => ({
            ...h,
            [t.key]: result.ok
                ? { state: 'ok', checkedAt: result.payload.data?.checked_at, ms: result.ms }
                : { state: 'error', ms: result.ms, status: result.status, message: failText(result, 'Health check failed.') },
        }));
    }, [tenant]);

    // Check the selected tenant when it changes, then poll every minute.
    useEffect(() => {
        if (!user || !tenant.token) return;
        void checkHealth(tenant);
        const timer = window.setInterval(() => void checkHealth(tenant), POLL_MS);
        return () => window.clearInterval(timer);
    }, [tenant.key, user]);

    const value = useMemo(() => ({ tenants, tenant, health, checkHealth }), [tenants, tenant, health, checkHealth]);

    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantValue {
    const ctx = useContext(TenantContext);
    if (!ctx) throw new Error('useTenant must be used inside TenantProvider');
    return ctx;
}
