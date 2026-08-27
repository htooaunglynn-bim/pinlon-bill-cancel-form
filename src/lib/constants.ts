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
