import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_MINIMUM_INVOICE_AMOUNT } from '@/lib/constants';
import { readSession, writeSession } from '@/lib/storage';

type Session = {
    staffToken: string | null;
    staffEmail: string | null;
    customerToken: string | null;
    pid: string;
    /** Overwritten from GET /api/v1/staff/settings once formulas are loaded. */
    minimumInvoiceAmount: number;

    setStaff: (token: string, email: string | null) => void;
    setCustomer: (token: string) => void;
    setPid: (pid: string) => void;
    setMinimumInvoiceAmount: (minimum: number) => void;
    signOutStaff: () => void;
    signOutCustomer: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [staffToken, setStaffToken] = useState(() => readSession<string | null>('staffToken', null));
    const [staffEmail, setStaffEmail] = useState(() => readSession<string | null>('staffEmail', null));
    const [customerToken, setCustomerToken] = useState(() => readSession<string | null>('customerToken', null));
    const [pid, setPid] = useState(() => readSession<string>('pid', ''));
    const [minimumInvoiceAmount, setMinimumInvoiceAmount] = useState(() =>
        readSession<number>('minimumInvoiceAmount', DEFAULT_MINIMUM_INVOICE_AMOUNT),
    );

    useEffect(() => { writeSession('staffToken', staffToken); }, [staffToken]);
    useEffect(() => { writeSession('staffEmail', staffEmail); }, [staffEmail]);
    useEffect(() => { writeSession('customerToken', customerToken); }, [customerToken]);
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

    const value = useMemo<Session>(
        () => ({
            staffToken, staffEmail, customerToken, pid, minimumInvoiceAmount,
            setStaff, setCustomer: setCustomerToken, setPid, setMinimumInvoiceAmount,
            signOutStaff, signOutCustomer,
        }),
        [staffToken, staffEmail, customerToken, pid, minimumInvoiceAmount, setStaff, signOutStaff, signOutCustomer],
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
    const session = useContext(SessionContext);
    if (!session) throw new Error('useSession must be used inside <SessionProvider>.');
    return session;
}
