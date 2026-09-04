import { useCallback, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useStatus } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';
import { UUID_PATTERN } from '@/lib/constants';
import { withQuery } from '@/lib/query';
import type { CustomerHit } from '@/lib/types';
import { mapCustomerHit } from './mappers';

/**
 * Turns a PID / PLGH code into the customer uuid the log endpoints want.
 *
 * Imperative on purpose (button- and Enter-driven): an effect here would refire
 * the search on every keystroke and fight the paged feed below it.
 */
export function useCustomerLookup() {
    const { staffToken } = useSession();
    const { status, say } = useStatus();
    const [uuid, setUuid] = useState<string | null>(null);
    const [customer, setCustomer] = useState<CustomerHit | null>(null);
    const [candidates, setCandidates] = useState<CustomerHit[]>([]);
    const [busy, setBusy] = useState(false);

    const clear = useCallback(() => {
        setUuid(null);
        setCustomer(null);
        setCandidates([]);
        say('');
    }, [say]);

    const choose = useCallback((hit: CustomerHit) => {
        setUuid(hit.uuid);
        setCustomer(hit);
        setCandidates([]);
        say(`Showing history for ${hit.name} (${hit.member_code}).`, 'success');
    }, [say]);

    const resolve = useCallback(async (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
            say('Enter a PID / PLGH code, or paste a customer uuid.', 'error');
            return;
        }

        // A uuid is what the endpoints take, so skip the round trip entirely.
        if (UUID_PATTERN.test(trimmed)) {
            setUuid(trimmed);
            setCustomer(null);
            setCandidates([]);
            say('Using that uuid directly.', 'success');
            return;
        }

        if (!staffToken) {
            say('Log in as staff first.', 'error');
            return;
        }

        setBusy(true);
        setCandidates([]);
        say('Looking up the customer…', 'busy');

        try {
            const { ok, status: httpStatus, payload } = await api(
                withQuery('/api/v1/staff/customers', { member_code: trimmed, per_page: 10 }),
                { token: staffToken },
            );

            if (!ok) {
                throw new Error(
                    httpStatus === 403
                        ? 'Not allowed: the customer lookup needs the customer.view permission.'
                        : fail(payload, 'Customer lookup failed.'),
                );
            }

            const hits: CustomerHit[] = (Array.isArray(payload.data) ? payload.data : []).map(mapCustomerHit);

            if (hits.length === 0) {
                setUuid(null);
                setCustomer(null);
                // The lookup filters out suspended and soft-deleted customers, while the log
                // endpoints are withTrashed() — so a viewable history can be unfindable by PID.
                say(
                    'No customer found for that PID. Suspended and deleted customers are not listed — paste their uuid instead.',
                    'error',
                );
                return;
            }

            if (hits.length === 1) {
                choose(hits[0]);
                return;
            }

            setUuid(null);
            setCustomer(null);
            setCandidates(hits);
            say(`${hits.length} customers start with that code — pick one.`, 'success');
        } catch (error) {
            setUuid(null);
            setCustomer(null);
            say((error as Error).message || 'Unable to contact the API.', 'error');
        } finally {
            setBusy(false);
        }
    }, [choose, say, staffToken]);

    return { uuid, customer, candidates, status, busy, resolve, choose, clear };
}
