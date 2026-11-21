import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCustomerSession } from '@/context/CustomerSessionContext';
import { useTenant } from '@/context/TenantContext';
import { customerApi } from '@/lib/api';
import { yangonDateOf, yangonToday } from '@/lib/dates';
import { failText } from '@/lib/errors';
import { useHistory } from '@/lib/history';
import type { CustomerTransaction } from '@/lib/types';

export type CustomerBill = {
    /** The reference bill cancel takes: invoice BID / POS earn ref, or redeem ref / point-payment UUID. */
    billId: string;
    kind: 'earn' | 'redeem';
    points: number;
    amount: number | null;
    at: string;
    /** A refund/recharge with the same reference already exists. */
    cancelled: boolean;
    /** Invoice QR made in this browser for the customer's PID that hasn't been claimed yet. */
    unclaimed: boolean;
};

/**
 * Today's cancellable bills for the customer signed in on the Customer app page.
 *
 * Server rows come from the customer's own point history: earn → Bill ID, redeem → Redemption ID
 * (bim-lpms BillCancelService::DIRECTIONS). Invoice PIDs are member codes, so local invoice QRs
 * generated for this member code that the customer hasn't claimed yet are listed too.
 */
export function useCustomerBills() {
    const { tenant } = useTenant();
    const { session, forget } = useCustomerSession();
    const history = useHistory();
    const [rows, setRows] = useState<CustomerTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const token = session?.token ?? null;
    const memberCode = session?.profile.member_code ?? null;

    const refresh = useCallback(async () => {
        if (!token) {
            setRows([]);
            return;
        }
        setLoading(true);
        const result = await customerApi<CustomerTransaction[] | { data: CustomerTransaction[] }>(tenant, '/points/history', {
            query: { per_page: 100 },
            token,
        });
        setLoading(false);

        if (result.status === 401) {
            forget();
            return;
        }
        if (!result.ok) {
            setError(failText(result, 'Could not load the customer\'s bills.'));
            return;
        }
        const data = result.payload.data;
        setRows(Array.isArray(data) ? data : data?.data ?? []);
        setError(null);
    }, [tenant, token, forget]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const bills = useMemo<CustomerBill[]>(() => {
        const today = yangonToday();
        const todays = rows.filter((r) => r.created_at && r.reference_id && yangonDateOf(r.created_at) === today);
        const refunded = new Set(todays.filter((r) => r.type === 'refund').map((r) => r.reference_id));
        const recharged = new Set(todays.filter((r) => r.type === 'recharge').map((r) => r.reference_id));

        const server: CustomerBill[] = todays
            .filter((r) => r.type === 'earn' || r.type === 'redeem')
            .map((r) => ({
                billId: r.reference_id as string,
                kind: r.type as 'earn' | 'redeem',
                points: Math.abs(Number(r.points)),
                amount: r.amount_mmk !== null && r.amount_mmk !== undefined ? Number(r.amount_mmk) : null,
                at: r.created_at as string,
                cancelled: r.type === 'earn' ? refunded.has(r.reference_id) : recharged.has(r.reference_id),
                unclaimed: false,
            }));

        const earned = new Set(server.filter((b) => b.kind === 'earn').map((b) => b.billId.toLowerCase()));
        const local: CustomerBill[] = memberCode
            ? history
                  .filter(
                      (h) =>
                          h.kind === 'qr-invoice' &&
                          h.tenant === tenant.key &&
                          (h.meta?.pid ?? '').toUpperCase() === memberCode.toUpperCase() &&
                          h.meta?.bid &&
                          yangonDateOf(h.at) === today &&
                          !earned.has(h.meta.bid.toLowerCase()),
                  )
                  .map((h) => ({
                      billId: h.meta?.bid as string,
                      kind: 'earn' as const,
                      points: 0,
                      amount: h.meta?.amount ? Number(h.meta.amount) : null,
                      at: h.at,
                      cancelled: false,
                      unclaimed: true,
                  }))
            : [];

        // Deduplicate local entries (the same QR may be recorded once per action).
        const seen = new Set<string>();
        return [...server, ...local].filter((b) => {
            const key = `${b.kind}|${b.billId}|${b.unclaimed}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [rows, history, memberCode, tenant.key]);

    return { bills, loading, error, refresh, session };
}
