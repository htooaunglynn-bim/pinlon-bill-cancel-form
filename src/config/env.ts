// Parses the VITE_* configuration once at startup.
//
// Sign-in no longer uses an admin password or a shared POS token. The operator signs in with a
// tenant id, the tenant's POS path slug and its LPMS token, all managed per tenant in the central
// dashboard (loyalty-central-dashboard, "LPMS integration"). The only build-time config left is
// how to find a tenant's API host from its id.

export type Tenant = {
    /** Tenant id, e.g. "pinlon". */
    key: string;
    name: string;
    /** Tenant API origin, e.g. https://pinlon-lpms.bimats.com (no trailing slash). */
    host: string;
    /** POS path slug: calls go to /api/v1/public/{slug}. Set per tenant in the central dashboard. */
    slug: string;
    /** Tenant LPMS token (Bearer). Held in sessionStorage for the length of the session. */
    token: string;
};

type KnownHost = { key: string; name: string; host: string };

export type AppConfig = {
    knownHosts: KnownHost[];
    /** e.g. https://{id}-lpms.bimats.com; `{id}` is replaced by the tenant id. */
    hostTemplate: string;
    sessionHours: number;
};

const env = import.meta.env;
const errors: string[] = [];

function parseKnownHosts(raw: string | undefined): KnownHost[] {
    if (!raw || !raw.trim()) return [];
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        errors.push('VITE_POS_TENANTS is not valid JSON.');
        return [];
    }
    if (!Array.isArray(parsed)) {
        errors.push('VITE_POS_TENANTS must be a JSON array.');
        return [];
    }
    const out: KnownHost[] = [];
    parsed.forEach((item, index) => {
        const row = item as Partial<KnownHost>;
        const key = String(row?.key ?? '').trim();
        const host = String(row?.host ?? '').trim().replace(/\/+$/, '');
        if (!key || !/^https?:\/\/[^/\s]+$/.test(host)) {
            errors.push(`VITE_POS_TENANTS[${index}] needs a "key" and a "host" like https://example.com.`);
            return;
        }
        out.push({ key, name: String(row?.name ?? key).trim() || key, host });
    });
    return out;
}

const hostTemplate = (env.VITE_TENANT_HOST_TEMPLATE ?? '').trim();
const knownHosts = parseKnownHosts(env.VITE_POS_TENANTS);
if (!knownHosts.length && !hostTemplate) {
    errors.push('Set VITE_POS_TENANTS (tenant id to host list) or VITE_TENANT_HOST_TEMPLATE (e.g. https://{id}-lpms.bimats.com).');
}
if (hostTemplate && !/^https?:\/\/[^/\s]*\{id\}[^/\s]*$/.test(hostTemplate)) {
    errors.push('VITE_TENANT_HOST_TEMPLATE must look like https://{id}-lpms.bimats.com.');
}

const hours = Number(env.VITE_SESSION_HOURS ?? 8);

export const config: AppConfig = {
    knownHosts,
    hostTemplate,
    sessionHours: Number.isFinite(hours) && hours > 0 ? hours : 8,
};

export const configErrors: readonly string[] = errors;

/** Resolves a tenant id to its API host and display name, or null when the id is unknown. */
export function resolveTenantHost(id: string): { name: string; host: string } | null {
    const known = config.knownHosts.find((t) => t.key === id);
    if (known) return { name: known.name, host: known.host };
    if (config.hostTemplate && /^[a-z0-9][a-z0-9-]*$/.test(id)) return { name: id, host: config.hostTemplate.replace('{id}', id) };
    return null;
}

export function maskToken(token: string): string {
    if (!token) return '(not set)';
    if (token.length <= 8) return '••••';
    return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}
