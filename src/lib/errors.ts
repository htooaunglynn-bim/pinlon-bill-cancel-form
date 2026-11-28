import type { ApiResult } from './types';

/** Plain-language hints for every POS error_code the backend can return. */
export const ERROR_HINTS: Record<string, string> = {
    UNAUTHENTICATED: 'The POS token was rejected. Sign out and check the token for this tenant in the central dashboard (Tenants → LPMS integration).',
    POS_POINT_PAYMENT_TOKEN_MISSING: 'The server has no POS_POINT_PAYMENT_TOKEN configured. Ask a backend admin to set it.',
    RATE_LIMITED: 'Too many POS calls. The limit is 120 per minute, shared by everyone using this token. Wait a minute and retry.',
    TENANT_SUSPENDED: 'This hospital is suspended. POS calls are blocked until a central admin reactivates it.',
    TENANT_PENDING: 'This hospital is not activated yet. Finish setup in the central dashboard first.',
    VALIDATION_ERROR: 'Some fields were rejected. Check the messages above.',
    POS_SCAN_QR_INVALID: 'The customer QR is invalid, expired (5 minutes), already used, or replaced by a newer one. Ask the customer to refresh it.',
    CUSTOMER_INACTIVE: 'This customer account is suspended or inactive.',
    REGISTRATION_REQUIRED: 'This customer has not finished registration in the app.',
    EARN_BELOW_MINIMUM: 'The amount earns 0 points. It is below the minimum invoice amount for this hospital.',
    BELOW_MINIMUM_REDEMPTION_BALANCE: 'The customer balance is below the minimum required before redeeming.',
    INSUFFICIENT_POINTS: 'The customer does not have enough points for this redemption.',
    BILL_NOT_FOUND: 'No earn or redeem was found for this bill reference.',
    BILL_ALREADY_CANCELLED: 'This bill was already cancelled. Treat it as done.',
    BILL_NOT_REVERSIBLE: 'This transaction type cannot be cancelled from the POS.',
    BILL_DATE_NOT_TODAY: 'Bills can only be cancelled on the same day (Asia/Yangon time).',
    BILL_POINTS_ALREADY_USED: 'The points from this bill have already been spent, so the earn cannot be refunded.',
    BILL_POINTS_EXPIRED: 'The points from this bill have expired.',
    REDEMPTION_ALREADY_VALIDATED: 'The redemption has already been validated and cannot be recharged.',
    BILL_CANCEL_FAILED: 'The server could not cancel the bill. Nothing was changed. Try again.',
    POINT_PAYMENT_DEDUCT_FAILED: 'The point payment could not be deducted. Check the callback state below.',
    REWARD_DISCOUNT_FAILED: 'The reward discount could not be applied. Check the callback state below.',
    OTP_COOLDOWN: 'A code was sent recently. Wait for the cooldown, then resend.',
    INVALID_OTP: 'That code is wrong or expired. Check it, or request a new one.',
    ACCOUNT_DELETED: 'This customer account has been deleted.',
    ACCOUNT_SUSPENDED: 'This customer account is suspended. Ask hospital staff to review it.',
    REWARD_UNAVAILABLE: 'This reward is not published or no longer available.',
    OUT_OF_STOCK: 'This reward is out of stock.',
    TIER_INELIGIBLE: 'The customer\'s tier is not eligible for this reward.',
    BABY_INELIGIBLE: 'This reward is only for families with a baby member.',
    REWARD_REDEMPTION_EXPIRED: 'This reward QR expired (48 hours). Redeem the reward again for a new QR.',
    ACCOUNT_UNDERAGE: 'This customer is under the age limit and can only use the app through a linked family account.',
};

/** Hints that differ for customer (mobile app) calls. */
const CUSTOMER_HINTS: Record<string, string> = {
    NOT_FOUND: 'This phone number is not registered. Onboard the customer first (Onboarding QR), then sign in.',
    UNAUTHENTICATED: 'The customer session expired or was signed out. Sign in again.',
    UNAUTHORIZED: 'The customer session expired or was signed out. Sign in again.',
    RATE_LIMITED: 'Too many requests. Wait a minute and try again.',
};

export type HintScope = 'pos' | 'customer';

/** One-line error message: Laravel field errors, else message, else error_code. */
export function failText(result: ApiResult, fallback = 'Request failed.'): string {
    if (result.networkError) return result.networkError;
    const { payload } = result;
    // Laravel field errors are string arrays; other entries (e.g. OTP_COOLDOWN's numeric
    // `retry_after`) are metadata, not messages.
    const fieldErrors = Object.values(payload.errors ?? {}).filter(Array.isArray).flat().filter((m) => typeof m === 'string');
    if (fieldErrors.length) return fieldErrors.join(' ');
    return payload.message || payload.error_code || `${fallback} (HTTP ${result.status})`;
}

export function hintFor(result: ApiResult, scope: HintScope = 'pos'): string | null {
    const code = result.payload.error_code;
    if (scope === 'customer') {
        if (code && CUSTOMER_HINTS[code]) return CUSTOMER_HINTS[code];
        if (result.status === 401) return CUSTOMER_HINTS.UNAUTHENTICATED;
        if (result.status === 404) return CUSTOMER_HINTS.NOT_FOUND;
        if (result.status === 429 && !code) return CUSTOMER_HINTS.RATE_LIMITED;
    }
    if (code && ERROR_HINTS[code]) return ERROR_HINTS[code];
    if (result.status === 401) return ERROR_HINTS.UNAUTHENTICATED;
    if (result.status === 429) return ERROR_HINTS.RATE_LIMITED;
    if (result.networkError) return 'The tenant host could not be reached. Check the host URL and your network.';
    return null;
}
