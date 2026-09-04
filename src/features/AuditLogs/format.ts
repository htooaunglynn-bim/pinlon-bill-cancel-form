import type { JsonValue } from '@/lib/types';

/** Locale date + HH:mm, or the raw string when the backend sends something unparseable. */
export function whenText(iso: string | null | undefined): string {
    if (!iso) return '—';

    const at = new Date(iso);
    if (Number.isNaN(at.getTime())) return iso;

    return `${at.toLocaleDateString()} ${at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

/** A one-line preview for a collapsed row. */
export function shortJson(value: JsonValue, limit = 60): string {
    if (value === null || value === undefined) return '—';

    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (!text) return '—';

    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

/** True when a value carries nothing worth showing: null, {}, [], ''. */
export function isBlank(value: JsonValue): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;

    return false;
}
