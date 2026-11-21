// Parses the VITE_* configuration once at startup.
//
// These values are compiled into the bundle (see README). The app never crashes on bad
// config: `configErrors` lists every problem and App renders a "Configuration missing" screen.

export type Tenant = {
    key: string;
    name: string;
    /** Tenant API origin, e.g. https://pinlon-lpms.bimats.com (no trailing slash). */
    host: string;
};

export type AppConfig = {
    adminUsername: string;
    adminPassword: string;
    posToken: string;
    tenants: Tenant[];
    defaultTenant: string;
    sessionHours: number;
};

const env = import.meta.env;
const errors: string[] = [];

function required(name: keyof ImportMetaEnv): string {
    const value = (env[name] ?? '').trim();
    if (!value) errors.push(`${name} is not set.`);
    return value;
}

function parseTenants(raw: string | undefined): Tenant[] {
    if (!raw || !raw.trim()) {
        errors.push('VITE_POS_TENANTS is not set.');
        return [];
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        errors.push('VITE_POS_TENANTS is not valid JSON.');
        return [];
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        errors.push('VITE_POS_TENANTS must be a non-empty JSON array.');
        return [];
    }

    const tenants: Tenant[] = [];
    parsed.forEach((item, index) => {
        const row = item as Partial<Tenant>;
        const key = String(row?.key ?? '').trim();
        const name = String(row?.name ?? key).trim();
        const host = String(row?.host ?? '').trim().replace(/\/+$/, '');

        if (!key || !/^https?:\/\/[^/\s]+$/.test(host)) {
            errors.push(`VITE_POS_TENANTS[${index}] needs a "key" and a "host" like https://example.com.`);
            return;
        }
        if (tenants.some((t) => t.key === key)) {
            errors.push(`VITE_POS_TENANTS has a duplicate key "${key}".`);
            return;
        }
        tenants.push({ key, name: name || key, host });
    });

    return tenants;
}

const tenants = parseTenants(env.VITE_POS_TENANTS);
const hours = Number(env.VITE_SESSION_HOURS ?? 8);

export const config: AppConfig = {
    adminUsername: required('VITE_ADMIN_USERNAME'),
    adminPassword: required('VITE_ADMIN_PASSWORD'),
    posToken: required('VITE_POS_TOKEN'),
    tenants,
    defaultTenant: (env.VITE_DEFAULT_TENANT ?? '').trim() || tenants[0]?.key || '',
    sessionHours: Number.isFinite(hours) && hours > 0 ? hours : 8,
};

export const configErrors: readonly string[] = errors;

export function maskToken(token: string): string {
    if (!token) return '(not set)';
    if (token.length <= 8) return '••••';
    return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}
