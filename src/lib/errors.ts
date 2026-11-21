import type { ApiResult } from './types';

/** Plain-language hints for every POS error_code the backend can return. */
export const ERROR_HINTS: Record<string, string> = {
    UNAUTHENTICATED: 'The POS token was rejected. Check VITE_POS_TOKEN matches POS_POINT_PAYMENT_TOKEN on the server.',
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
};

/** One-line error message: Laravel field errors, else message, else error_code. */
export function failText(result: ApiResult, fallback = 'Request failed.'): string {
    if (result.networkError) return result.networkError;
    const { payload } = result;
    const fieldErrors = Object.values(payload.errors ?? {}).flat();
    if (fieldErrors.length) return fieldErrors.join(' ');
    return payload.message || payload.error_code || `${fallback} (HTTP ${result.status})`;
}

export function hintFor(result: ApiResult): string | null {
    const code = result.payload.error_code;
    if (code && ERROR_HINTS[code]) return ERROR_HINTS[code];
    if (result.status === 401) return ERROR_HINTS.UNAUTHENTICATED;
    if (result.status === 429) return ERROR_HINTS.RATE_LIMITED;
    if (result.networkError) return 'The tenant host could not be reached. Check the host URL and your network.';
    return null;
}
