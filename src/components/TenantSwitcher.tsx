import { useTenant, type Health } from '@/context/TenantContext';

const DOT: Record<Health['state'], string> = {
    unknown: 'bg-clay-muted/50',
    checking: 'bg-sun animate-pulse',
    ok: 'bg-mint-deep',
    error: 'bg-pink-deep',
};

const LABEL: Record<Health['state'], string> = {
    unknown: 'Not checked',
    checking: 'Checking…',
    ok: 'Token OK',
    error: 'Unreachable',
};

export function HealthDot({ health }: { health?: Health }) {
    const state = health?.state ?? 'unknown';
    return <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT[state]}`} />;
}

export function TenantSwitcher() {
    const { tenant, health, checkHealth } = useTenant();
    const h = health[tenant.key];

    return (
        <div>
            <label htmlFor="tenant" className="mb-2 block px-1 font-display text-xs font-semibold tracking-wide text-clay-muted uppercase">
                Hospital
            </label>
            <p id="tenant" className="clay-inset rounded-blob bg-cream px-4 py-2.5 text-sm font-semibold">{tenant.name}</p>
            <button
                type="button"
                onClick={() => void checkHealth(tenant, true)}
                title={h?.message ?? 'Re-check tenant token'}
                className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-blob px-1 text-left text-xs text-clay-muted hover:text-clay-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep"
            >
                <HealthDot health={h} />
                <span className="truncate">
                    {h?.state === 'error' && h.status === 401 ? 'Token rejected' : h?.state === 'error' && h.status ? `Error ${h.status}` : LABEL[h?.state ?? 'unknown']}
                    {h?.ms !== undefined && h.state !== 'checking' ? ` · ${h.ms} ms` : ''}
                </span>
            </button>
        </div>
    );
}
