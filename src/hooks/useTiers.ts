import { useEffect, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { api } from '@/lib/api';

export type Tier = {
    id: number;
    /** name_en, falling back to name_my then slug — whatever the tenant filled in. */
    name: string;
    multiplier: number;
};

/**
 * The tenant's tiers, for picking a realistic tier_multiplier when testing a formula.
 * Failures are silent: the caller falls back to a plain number input.
 */
export function useTiers(): { tiers: Tier[]; loading: boolean } {
    const { staffToken } = useSession();
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!staffToken) {
            setTiers([]);
            return;
        }

        let cancelled = false;
        setLoading(true);

        api('/api/v1/staff/tiers?per_page=100', { token: staffToken })
            .then(({ ok, payload }) => {
                if (cancelled || !ok) return;

                const entries: any[] = Array.isArray(payload.data) ? payload.data : [];
                setTiers(
                    entries
                        .map((entry) => ({
                            id: Number(entry.id),
                            name: String(entry.name_en || entry.name_my || entry.slug || `Tier ${entry.id}`),
                            multiplier: Number(entry.points_multiplier),
                        }))
                        .filter((tier) => Number.isFinite(tier.multiplier)),
                );
            })
            .catch(() => {
                // Offline or unauthenticated — the number input stays.
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [staffToken]);

    return { tiers, loading };
}
