import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
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

/** The most recent POS scan QR generated on the Mobile page, shared with the terminal pages. */
export type ActiveQr = {
    qr: string;
    expiresAt: string;
    name: string;
    memberCode: string;
};

type CustomerSessionValue = {
    session: CustomerSession | null;
    activeQr: ActiveQr | null;
    setActiveQr: (qr: ActiveQr) => void;
    /** Forget the shared QR (expired, used by an earn/redeem, or dismissed). */
    clearActiveQr: () => void;
    setSession: (session: CustomerSession) => void;
    updateProfile: (profile: CustomerProfile) => void;
    /** Revokes the token on the server (best effort) and forgets it locally. */
    signOut: () => Promise<void>;
    /** Forgets the token locally without calling the server (e.g. after a 401). */
    forget: () => void;
};

const CustomerSessionContext = createContext<CustomerSessionValue | null>(null);
const key = (tenantKey: string) => `customer:${tenantKey}`;
const qrKey = (tenantKey: string) => `activeQr:${tenantKey}`;

function isLive(qr: ActiveQr | null): qr is ActiveQr {
    return !!qr && new Date(qr.expiresAt).getTime() > Date.now();
}

function loadActiveQr(tenantKey: string): ActiveQr | null {
    const qr = readSession<ActiveQr | null>(qrKey(tenantKey), null);
    return isLive(qr) ? qr : null;
}

/** Forget every hospital's customer session (used on dashboard sign-out). */
export function clearAllCustomerSessions() {
    config.tenants.forEach((t) => {
        writeSession(key(t.key), null);
        writeSession(qrKey(t.key), null);
    });
}

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const [session, setState] = useState<CustomerSession | null>(() => readSession<CustomerSession | null>(key(tenant.key), null));
    const [activeQr, setActiveQrState] = useState<ActiveQr | null>(() => loadActiveQr(tenant.key));

    // Load the session that belongs to the newly selected hospital.
    useEffect(() => {
        setState(readSession<CustomerSession | null>(key(tenant.key), null));
        setActiveQrState(loadActiveQr(tenant.key));
    }, [tenant.key]);

    // Dashboard sign-out wipes customer sessions too.
    useEffect(() => {
        if (!user) {
            clearAllCustomerSessions();
            setState(null);
            setActiveQrState(null);
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

    const setActiveQr = useCallback((qr: ActiveQr) => {
        writeSession(qrKey(tenant.key), qr);
        setActiveQrState(qr);
    }, [tenant.key]);

    const clearActiveQr = useCallback(() => {
        writeSession(qrKey(tenant.key), null);
        setActiveQrState(null);
    }, [tenant.key]);

    // Drop the shared QR the moment it expires, so no page keeps offering a dead token.
    useEffect(() => {
        if (!activeQr) return;
        const ms = new Date(activeQr.expiresAt).getTime() - Date.now();
        const timer = window.setTimeout(clearActiveQr, Math.max(0, ms));
        return () => window.clearTimeout(timer);
    }, [activeQr, clearActiveQr]);

    const forget = useCallback(() => {
        writeSession(key(tenant.key), null);
        setState(null);
        clearActiveQr();
    }, [tenant.key, clearActiveQr]);

    const signOut = useCallback(async () => {
        const token = session?.token;
        forget();
        if (token) await customerApi(tenant, '/logout', { method: 'POST', token });
    }, [session, forget, tenant]);

    const value = useMemo(
        () => ({ session, activeQr, setActiveQr, clearActiveQr, setSession, updateProfile, signOut, forget }),
        [session, activeQr, setActiveQr, clearActiveQr, setSession, updateProfile, signOut, forget],
    );

    return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>;
}

export function useCustomerSession(): CustomerSessionValue {
    const ctx = useContext(CustomerSessionContext);
    if (!ctx) throw new Error('useCustomerSession must be used inside CustomerSessionProvider');
    return ctx;
}

/** The live shared customer QR plus seconds left (0 once gone). */
export function useActiveQr() {
    const { activeQr, clearActiveQr } = useCustomerSession();
    const secondsLeft = useCountdown(activeQr ? new Date(activeQr.expiresAt).getTime() : null);
    return { activeQr: activeQr && secondsLeft > 0 ? activeQr : null, secondsLeft, clearActiveQr };
}
