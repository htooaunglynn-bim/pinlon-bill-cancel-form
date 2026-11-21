import { useSyncExternalStore } from 'react';
import { readLocal, writeLocal } from './storage';

// Local preferences that mirror per-hospital server settings. The public POS API does not
// expose these, so the admin sets them here to match the hospital's configuration.

export type Prefs = {
    /** points.minimum_invoice_amount (server default 5000). */
    minimumInvoiceAmount: number;
    /** customers.below_age_limit (server default 16). */
    ageLimit: number;
    /** Default tenant_locations id sent as location_id. Blank means none. */
    defaultLocationId: string;
    /** Header line printed at the top of invoice receipts. */
    receiptHeader: string;
    /** Footer line printed at the bottom of invoice receipts. */
    receiptFooter: string;
};

export const DEFAULT_PREFS: Prefs = {
    minimumInvoiceAmount: 5000,
    ageLimit: 16,
    defaultLocationId: '',
    receiptHeader: 'Pinlon Hospital',
    receiptFooter: 'Scan with the Pinlon app to earn points today.',
};

const KEY = 'prefs';
let prefs: Prefs = { ...DEFAULT_PREFS, ...readLocal<Partial<Prefs>>(KEY, {}) };
const listeners = new Set<() => void>();

export function setPrefs(next: Partial<Prefs>) {
    prefs = { ...prefs, ...next };
    writeLocal(KEY, prefs);
    listeners.forEach((fn) => fn());
}

export function getPrefs(): Prefs {
    return prefs;
}

export function usePrefs(): Prefs {
    return useSyncExternalStore(
        (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        () => prefs,
        () => prefs,
    );
}
