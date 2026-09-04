import type {
    ChangeLogRow,
    CustomerAuditRow,
    CustomerHit,
    JsonValue,
    PageMeta,
    SystemAuditRow,
    TimelineRow,
} from '@/lib/types';

/**
 * The one loose boundary per feed. Everything downstream is typed; these
 * functions are where the API's `any` stops.
 */

export function mapMeta(raw: any): PageMeta | null {
    if (!raw || typeof raw !== 'object') return null;

    return {
        current_page: Number(raw.current_page ?? 1),
        per_page: Number(raw.per_page ?? 0),
        total: Number(raw.total ?? 0),
        last_page: Number(raw.last_page ?? 1),
        from: raw.from === null || raw.from === undefined ? null : Number(raw.from),
        to: raw.to === null || raw.to === undefined ? null : Number(raw.to),
    };
}

export function mapSystemAuditRow(raw: any): SystemAuditRow {
    return {
        id: raw.id === null || raw.id === undefined ? null : Number(raw.id),
        uuid: text(raw.uuid) ?? '',
        date_time: text(raw.date_time) ?? '',
        plgh_code: text(raw.plgh_code),
        customer_name: text(raw.customer_name),
        customer_uuid: text(raw.customer_uuid),
        action: text(raw.action) ?? '',
        action_label: text(raw.action_label) ?? text(raw.action) ?? '',
        old_values: json(raw.old_values),
        new_values: json(raw.new_values),
        performed_by: text(raw.performed_by),
        reference_type: text(raw.reference_type),
        reference_id: raw.reference_id ?? null,
        ip_address: text(raw.ip_address),
        metadata: json(raw.metadata),
    };
}

export function mapTimelineRow(raw: any): TimelineRow {
    return {
        id: Number(raw.id ?? 0),
        kind: raw.kind === 'change' ? 'change' : 'action',
        at: text(raw.at) ?? '',
        event: text(raw.event),
        subject_type: text(raw.subject_type),
        log_name: text(raw.log_name),
        old: json(raw.old),
        new: json(raw.new),
        actor_name: text(raw.actor_name),
        actor_role: text(raw.actor_role),
        actor_source: text(raw.actor_source),
        reason: text(raw.reason),
    };
}

export function mapCustomerAuditRow(raw: any): CustomerAuditRow {
    return {
        uuid: text(raw.uuid) ?? '',
        action: text(raw.action) ?? '',
        old_values: json(raw.old_values),
        new_values: json(raw.new_values),
        performed_id: raw.performed_id === null || raw.performed_id === undefined ? null : Number(raw.performed_id),
        performed_name: text(raw.performed_name),
        reference_type: text(raw.reference_type),
        reference_id: raw.reference_id ?? null,
        ip_address: text(raw.ip_address),
        metadata: json(raw.metadata),
        created_at: text(raw.created_at) ?? '',
    };
}

export function mapChangeLogRow(raw: any): ChangeLogRow {
    return {
        id: raw.id === null || raw.id === undefined ? null : Number(raw.id),
        date_time: text(raw.date_time) ?? '',
        source: text(raw.source) ?? '',
        subject: text(raw.subject) ?? '',
        subject_id: raw.subject_id === null || raw.subject_id === undefined ? null : Number(raw.subject_id),
        field: text(raw.field),
        from: text(raw.from),
        to: text(raw.to),
        actor_name: text(raw.actor_name),
        actor_email: text(raw.actor_email),
        actor_phone: text(raw.actor_phone),
        actor_role: text(raw.actor_role),
        actor_source: text(raw.actor_source),
        reason: text(raw.reason),
    };
}

export function mapCustomerHit(raw: any): CustomerHit {
    return {
        uuid: text(raw.uuid) ?? '',
        member_code: text(raw.member_code) ?? '',
        name: text(raw.name) ?? '(unnamed)',
        phone: text(raw.phone),
    };
}

/** Null for anything not worth printing, so empty fields render as nothing. */
function text(value: unknown): string | null {
    if (value === null || value === undefined) return null;

    const trimmed = String(value).trim();

    return trimmed === '' ? null : trimmed;
}

function json(value: unknown): JsonValue {
    return (value ?? null) as JsonValue;
}
