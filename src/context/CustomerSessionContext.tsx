import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config } from '@/config/env';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { customerApi } from '@/lib/api';
import { readSession, writeSession } from '@/lib/storage';
import type { CustomerProfile } from '@/lib/types';

// A signed-in customer for the Mobile page, kept per hospital so switching hospital shows
// that hospital's own session. Stored in sessionStorage: it ends with the browser tab.

export type CustomerSession = {
    token: string;
    profile: CustomerProfile;
    signedInAt: string;
};

type CustomerSessionValue = {
    session: CustomerSession | null;
    setSession: (session: CustomerSession) => void;
    updateProfile: (profile: CustomerProfile) => void;
    /** Revokes the token on the server (best effort) and forgets it locally. */
    signOut: () => Promise<void>;
    /** Forgets the token locally without calling the server (e.g. after a 401). */
    forget: () => void;
};

const CustomerSessionContext = createContext<CustomerSessionValue | null>(null);
const key = (tenantKey: string) => `customer:${tenantKey}`;

/** Forget every hospital's customer session (used on dashboard sign-out). */
export function clearAllCustomerSessions() {
    config.tenants.forEach((t) => writeSession(key(t.key), null));
}

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const [session, setState] = useState<CustomerSession | null>(() => readSession<CustomerSession | null>(key(tenant.key), null));

    // Load the session that belongs to the newly selected hospital.
    useEffect(() => {
        setState(readSession<CustomerSession | null>(key(tenant.key), null));
    }, [tenant.key]);

    // Dashboard sign-out wipes customer sessions too.
    useEffect(() => {
        if (!user) {
            clearAllCustomerSessions();
            setState(null);
        }
    }, [user]);

    const setSession = useCallback((next: CustomerSession) => {
        writeSession(key(tenant.key), next);
        setState(next);
    }, [tenant.key]);

    const updateProfile = useCallback((profile: CustomerProfile) => {
        setState((current) => {
            if (!current) return current;
            const next = { ...current, profile };
            writeSession(key(tenant.key), next);
            return next;
        });
    }, [tenant.key]);

    const forget = useCallback(() => {
        writeSession(key(tenant.key), null);
        setState(null);
    }, [tenant.key]);

    const signOut = useCallback(async () => {
        const token = session?.token;
        forget();
        if (token) await customerApi(tenant, '/logout', { method: 'POST', token });
    }, [session, forget, tenant]);

    const value = useMemo(() => ({ session, setSession, updateProfile, signOut, forget }), [session, setSession, updateProfile, signOut, forget]);

    return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>;
}

export function useCustomerSession(): CustomerSessionValue {
    const ctx = useContext(CustomerSessionContext);
    if (!ctx) throw new Error('useCustomerSession must be used inside CustomerSessionProvider');
    return ctx;
}
