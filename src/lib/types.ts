export type Variables = Record<string, number>;

export type DepartmentFormula = {
    department: string;
    formula: string;
    variables: Variables;
};

/** A department row as held in React state: same shape plus a stable key. */
export type FormulaRowState = DepartmentFormula & {
    id: string;
    /** Variables are kept as raw strings while editing so a half-typed value isn't coerced. */
    varRows: VariableRowState[];
    /** Created in-app via "+ Add department": the formula and the variable names are fixed. */
    locked?: boolean;
};

export type VariableRowState = { id: string; name: string; value: string };

export type ApiPayload = {
    success?: boolean;
    message?: string;
    error_code?: string;
    errors?: Record<string, string[]>;
    data?: any;
};

export type ApiResult = { status: number; ok: boolean; payload: ApiPayload };

// ---------------------------------------------------------------------------
// Audit & activity log feeds (staff plane). All four endpoints paginate the
// same way, so they share one meta shape.
// ---------------------------------------------------------------------------

export type PageMeta = {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
};

/** Whatever the audit feeds put in old_values / new_values / metadata. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** GET /api/v1/staff/reports/system-audit-log */
export type SystemAuditRow = {
    /** A row number across the whole result set, not a primary key — never a React key. */
    id: number | null;
    uuid: string;
    date_time: string;
    plgh_code: string | null;
    customer_name: string | null;
    customer_uuid: string | null;
    action: string;
    action_label: string;
    old_values: JsonValue;
    new_values: JsonValue;
    performed_by: string | null;
    reference_type: string | null;
    reference_id: string | number | null;
    ip_address: string | null;
    metadata: JsonValue;
};

/** GET /api/v1/staff/customers/{uuid}/timeline — audits + activity_log, merged. */
export type TimelineRow = {
    /** The source table's PK, so ids collide across kinds: key on `${kind}-${id}`. */
    id: number;
    kind: 'change' | 'action';
    at: string;
    event: string | null;
    /** Present on kind: 'change' only. */
    subject_type?: string | null;
    /** Present on kind: 'action' only. */
    log_name?: string | null;
    old: JsonValue;
    new: JsonValue;
    actor_name: string | null;
    actor_role: string | null;
    actor_source: string | null;
    reason: string | null;
};

/** GET /api/v1/staff/customers/{uuid}/audit-logs */
export type CustomerAuditRow = {
    uuid: string;
    action: string;
    old_values: JsonValue;
    new_values: JsonValue;
    performed_id: number | null;
    performed_name: string | null;
    reference_type: string | null;
    reference_id: string | number | null;
    ip_address: string | null;
    metadata: JsonValue;
    created_at: string;
};

/** GET /api/v1/staff/logs — tier and setting field changes. */
export type ChangeLogRow = {
    /** Row number again, and this feed has nothing else stable — key on the composite. */
    id: number | null;
    date_time: string;
    source: string;
    subject: string;
    subject_id: number | null;
    field: string | null;
    /** Strings here, unlike the object old/new of the other feeds — JSON-encoded when structured. */
    from: string | null;
    to: string | null;
    actor_name: string | null;
    actor_email: string | null;
    actor_phone: string | null;
    actor_role: string | null;
    actor_source: string | null;
    reason: string | null;
};

/** One hit from GET /api/v1/staff/customers?member_code=… */
export type CustomerHit = {
    uuid: string;
    member_code: string;
    name: string;
    phone: string | null;
};

// ---------------------------------------------------------------------------
// POS bill cancel — POST /api/v1/public/pos/bill/cancel
// ---------------------------------------------------------------------------

/**
 * One reversed leg. `refund` takes back points an earn awarded; `recharge` gives back
 * points a redeem spent. `reference_type` is the *original* leg's source.
 */
export type BillReversal = {
    reversal_type: 'refund' | 'recharge';
    reference_type: 'pos_earn' | 'invoice_bid' | 'pos_redeem' | 'point_payment';
    original_type: 'earn' | 'redeem';
    points_reversed: number;
    points_balance_after: number;
    reversed_at: string;
};

/** `reversals` holds 1 or 2 entries, recharge first. */
export type BillCancelResult = {
    bill_id: string;
    redemption_id: string | null;
    customer_name: string;
    cancelled_at: string;
    points_balance_after: number;
    /** Signed: negative when points were taken back, positive when given back. */
    net_points_change: number;
    /** Tier slug, or null when the reversal did not move the customer's tier. */
    tier_changed_to: string | null;
    reversals: BillReversal[];
};
