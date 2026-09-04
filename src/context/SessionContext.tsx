import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_MINIMUM_INVOICE_AMOUNT } from '@/lib/constants';
import { readSession, writeSession } from '@/lib/storage';

type Session = {
    staffToken: string | null;
    staffEmail: string | null;
    customerToken: string | null;
    /**
     * The shared POS bearer token (POS_POINT_PAYMENT_TOKEN) the public /pos/* endpoints expect.
     * Pasted in on the Bill Cancel page rather than baked in at build time, so it never lands
     * in the bundle and can be swapped per tenant without a rebuild.
     */
    posToken: string | null;
    pid: string;
    /** Overwritten from GET /api/v1/staff/settings once formulas are loaded. */
    minimumInvoiceAmount: number;

    setStaff: (token: string, email: string | null) => void;
    setCustomer: (token: string) => void;
    setPosToken: (token: string | null) => void;
    setPid: (pid: string) => void;
    setMinimumInvoiceAmount: (minimum: number) => void;
    signOutStaff: () => void;
    signOutCustomer: () => void;
    signOutPos: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [staffToken, setStaffToken] = useState(() => readSession<string | null>('staffToken', null));
    const [staffEmail, setStaffEmail] = useState(() => readSession<string | null>('staffEmail', null));
    const [customerToken, setCustomerToken] = useState(() => readSession<string | null>('customerToken', null));
    const [posToken, setPosToken] = useState(() => readSession<string | null>('posToken', null));
    const [pid, setPid] = useState(() => readSession<string>('pid', ''));
    const [minimumInvoiceAmount, setMinimumInvoiceAmount] = useState(() =>
        readSession<number>('minimumInvoiceAmount', DEFAULT_MINIMUM_INVOICE_AMOUNT),
    );

    useEffect(() => { writeSession('staffToken', staffToken); }, [staffToken]);
    useEffect(() => { writeSession('staffEmail', staffEmail); }, [staffEmail]);
    useEffect(() => { writeSession('customerToken', customerToken); }, [customerToken]);
    useEffect(() => { writeSession('posToken', posToken); }, [posToken]);
    useEffect(() => { writeSession('pid', pid); }, [pid]);
    useEffect(() => { writeSession('minimumInvoiceAmount', minimumInvoiceAmount); }, [minimumInvoiceAmount]);

    const setStaff = useCallback((token: string, email: string | null) => {
        setStaffToken(token);
        setStaffEmail(email);
    }, []);

    const signOutStaff = useCallback(() => {
        setStaffToken(null);
        setStaffEmail(null);
    }, []);

    const signOutCustomer = useCallback(() => {
        setCustomerToken(null);
        setPid('');
    }, []);

    const signOutPos = useCallback(() => {
        setPosToken(null);
    }, []);

    const value = useMemo<Session>(
        () => ({
            staffToken, staffEmail, customerToken, posToken, pid, minimumInvoiceAmount,
            setStaff, setCustomer: setCustomerToken, setPosToken, setPid, setMinimumInvoiceAmount,
            signOutStaff, signOutCustomer, signOutPos,
        }),
        [staffToken, staffEmail, customerToken, posToken, pid, minimumInvoiceAmount, setStaff, signOutStaff, signOutCustomer, signOutPos],
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
    const session = useContext(SessionContext);
    if (!session) throw new Error('useSession must be used inside <SessionProvider>.');
    return session;
}
