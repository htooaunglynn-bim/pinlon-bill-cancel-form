/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ADMIN_USERNAME?: string;
    readonly VITE_ADMIN_PASSWORD?: string;
    readonly VITE_POS_TOKEN?: string;
    readonly VITE_POS_TENANTS?: string;
    readonly VITE_DEFAULT_TENANT?: string;
    readonly VITE_SESSION_HOURS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
