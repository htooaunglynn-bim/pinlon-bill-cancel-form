/**
 * Plain-language hints for the error_code values POST /pos/bill/cancel returns.
 * The API's own `message` is already shown; this is the "so what do I do about it" line
 * underneath it, aimed at whoever is running a test sequence by hand.
 */
export const CANCEL_HINTS: Record<string, string> = {
    BILL_NOT_FOUND:
        'No transaction carries that reference. Check the BID / reference you sent when the bill was recorded.',
    BILL_ALREADY_CANCELLED:
        'A repeat is refused, not replayed — the first cancel already reversed this bill.',
    BILL_NOT_REVERSIBLE:
        'Check which field the reference belongs in: bill_id is the reference the bill EARNED under, redemption_id the one it SPENT under.',
    BILL_DATE_NOT_TODAY:
        'Only bills from today (Asia/Yangon) can be cancelled.',
    BILL_POINTS_ALREADY_USED:
        'The earned points were already spent. Cancel the redeem leg first (redemption_id), then cancel this earn.',
    BILL_POINTS_EXPIRED:
        'The points from this bill have expired, so they can no longer be taken back.',
    REDEMPTION_ALREADY_VALIDATED:
        'The reward was already collected at the counter, so the redemption cannot be undone here.',
    BILL_CANCEL_FAILED:
        'The reversal was refused. The message above is the specific reason from the service.',
    VALIDATION_ERROR:
        'A field was rejected before the cancel ran — nothing was reversed.',
    UNAUTHENTICATED:
        'POS token rejected. Paste and verify the token again above.',
    TENANT_SUSPENDED:
        'This tenant is suspended, so POS endpoints are closed.',
    TENANT_PENDING:
        'This tenant is not active yet, so POS endpoints are closed.',
    RATE_LIMITED:
        'Too many POS calls in the last minute. Wait, then retry.',
};
