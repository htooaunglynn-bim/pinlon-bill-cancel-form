export const OTP = '000000';   // master OTP; only accepted when APP_ENV is local/uat/testing

// Supplied by the backend at earn time; shown read-only so it's obvious they
// can be used in a formula but never declared here.
export const SYSTEM_VARIABLES: ReadonlyArray<readonly [string, string]> = [
    ['amount', 'invoice amount'],
    ['tier_multiplier', "customer's tier"],
];

/** Departments created in-app are locked to this formula; only the variable values are tunable. */
export const NEW_DEPARTMENT_FORMULA = 'amount * tier_multiplier * service / percent';
export const NEW_DEPARTMENT_VARIABLES = { percent: 100, service: 1 };

export const RESERVED = SYSTEM_VARIABLES.map(([name]) => name);
export const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const DEVICE_NAME = 'department-formula-test-page';

/** Overwritten from GET /api/v1/staff/settings once formulas are loaded. */
export const DEFAULT_MINIMUM_INVOICE_AMOUNT = 5000;

// ---------------------------------------------------------------------------
// Audit & activity log filters. Every list below mirrors a Rule::in() on the
// backend: a value outside it is a 422, not a silent fallback.
// ---------------------------------------------------------------------------

/**
 * CustomerAuditLog::reportableActions(). bill_cancel exists as a constant but is
 * deliberately absent from the reportable list, so the report rejects it.
 */
export const SYSTEM_AUDIT_ACTIONS: ReadonlyArray<readonly [string, string]> = [
    ['', 'Any action'],
    ['customer_create', 'Customer Created'],
    ['phone_change', 'Phone Change'],
    ['points_adjust', 'Points Adjustment'],
    ['customer_support.created', 'Customer Support Created'],
    ['customer_support.updated', 'Customer Support Updated'],
    ['customer_support.deleted', 'Customer Support Deleted'],
];

/** IndexCustomerAuditLogRequest accepts only these two. */
export const CUSTOMER_AUDIT_ACTIONS: ReadonlyArray<readonly [string, string]> = [
    ['', 'Any action'],
    ['phone_change', 'Phone Change'],
    ['points_adjust', 'Points Adjustment'],
];

/** The two sort whitelists differ per feed — they must not be shared. */
export const SYSTEM_AUDIT_SORTS: ReadonlyArray<readonly [string, string]> = [
    ['created_at', 'Date & time'],
    ['action', 'Action'],
];

export const CHANGE_LOG_SORTS: ReadonlyArray<readonly [string, string]> = [
    ['date_time', 'Date & time'],
    ['source', 'Source'],
    ['subject', 'Subject'],
    ['field', 'Field'],
];

export const CHANGE_LOG_SOURCES: ReadonlyArray<readonly [string, string]> = [
    ['', 'Both trails'],
    ['tier', 'Tier'],
    ['setting', 'Setting'],
];

export const SORT_DIRS: ReadonlyArray<readonly [string, string]> = [
    ['desc', 'Newest first'],
    ['asc', 'Oldest first'],
];

/** Sent explicitly on every request: the backend default is env-dependent (10). */
export const PER_PAGE_OPTIONS: ReadonlyArray<readonly [string, string]> = [
    ['10', '10 per page'],
    ['20', '20 per page'],
    ['50', '50 per page'],
    ['100', '100 per page'],
];

export const DEFAULT_PER_PAGE = 20;

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
