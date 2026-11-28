/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_POS_TENANTS?: string;
    readonly VITE_TENANT_HOST_TEMPLATE?: string;
    readonly VITE_SESSION_HOURS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
