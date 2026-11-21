import { useSyncExternalStore } from 'react';
import { readLocal, writeLocal } from './storage';

// Local activity log. The POS API has no history endpoint, so every call and every QR
// generated from this dashboard is recorded here, in this browser only.

export type HistoryKind =
    | 'health'
    | 'lookup'
    | 'earn'
    | 'redeem'
    | 'bill-cancel'
    | 'claim'
    | 'reward-apply'
    | 'qr-onboarding'
    | 'qr-link'
    | 'qr-invoice'
    | 'otp-request'
    | 'otp-verify'
    | 'qr-posscan'
    | 'reward-redeem';

export type HistoryEntry = {
    id: string;
    at: string;
    tenant: string;
    kind: HistoryKind;
    summary: string;
    ok: boolean;
    status: number | null;
    ms: number | null;
    request: unknown;
    response: unknown;
    /** Values used by follow-up actions (re-print a QR, cancel a bill). */
    meta?: Record<string, string>;
};

export const KIND_LABEL: Record<HistoryKind, string> = {
    health: 'Health check',
    lookup: 'Customer lookup',
    earn: 'Earn points',
    redeem: 'Redeem points',
    'bill-cancel': 'Bill cancel',
    claim: 'Point-payment claim',
    'reward-apply': 'Reward apply',
    'qr-onboarding': 'Onboarding QR',
    'qr-link': 'Family link QR',
    'qr-invoice': 'Invoice QR',
    'otp-request': 'OTP request',
    'otp-verify': 'OTP sign-in',
    'qr-posscan': 'Customer POS QR',
    'reward-redeem': 'Reward redeemed (app)',
};

const KEY = 'history';
const LIMIT = 1000;

let entries: HistoryEntry[] = readLocal<HistoryEntry[]>(KEY, []);
const listeners = new Set<() => void>();

function emit() {
    writeLocal(KEY, entries);
    listeners.forEach((fn) => fn());
}

function newId(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'at'>): HistoryEntry {
    const full: HistoryEntry = { ...entry, id: newId(), at: new Date().toISOString() };
    entries = [full, ...entries].slice(0, LIMIT);
    emit();
    return full;
}

export function clearHistory() {
    entries = [];
    emit();
}

function subscribe(fn: () => void) {
    listeners.add(fn);
    // Keep tabs in sync.
    const onStorage = (event: StorageEvent) => {
        if (event.key === `pinlon-pos:${KEY}`) {
            entries = readLocal<HistoryEntry[]>(KEY, []);
            fn();
        }
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(fn);
        window.removeEventListener('storage', onStorage);
    };
}

export function useHistory(): HistoryEntry[] {
    return useSyncExternalStore(subscribe, () => entries, () => entries);
}

export function isToday(iso: string): boolean {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJson(rows: HistoryEntry[]) {
    download(`pos-history-${Date.now()}.json`, JSON.stringify(rows, null, 2), 'application/json');
}

export function exportCsv(rows: HistoryEntry[]) {
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['at', 'tenant', 'kind', 'ok', 'status', 'ms', 'summary'];
    const lines = rows.map((r) => [r.at, r.tenant, r.kind, r.ok, r.status, r.ms, r.summary].map(cell).join(','));
    download(`pos-history-${Date.now()}.csv`, [head.join(','), ...lines].join('\n'), 'text/csv');
}
