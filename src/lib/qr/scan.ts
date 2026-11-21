// Parsers for QRs the POS *reads* from the customer's phone.

/**
 * Scan-first customer QR from POST /api/v1/customer/pos-scan:
 * `POSSCAN{tenant}PS{32 hex}`, or the legacy `POSSCAN:{tenant}:PS-{token}`.
 * Mirrors PosScanService::extractToken(); the tenant segment is ignored server-side.
 */
export function parsePosScanQr(text: string): { token: string; legacy: boolean } | null {
    const value = text.trim();
    const modern = /^POSSCAN.*(PS[0-9A-F]{32})$/i.exec(value);
    if (modern) return { token: modern[1].toUpperCase(), legacy: false };

    const parts = value.split(':');
    if (parts.length >= 3 && parts[0].toUpperCase() === 'POSSCAN' && parts.slice(2).join(':').trim()) {
        return { token: parts.slice(2).join(':').trim(), legacy: true };
    }
    return null;
}

export type RedemptionQr = {
    type: 'CLAIM' | 'REWARD';
    uuid: string;
    memberCode: string;
    amount: string;
    amountType: string;
    date: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Redemption QR from QrCodeService::buildStandardRedemptionQrString():
 * `TYPE,UUID,MEMBER_CODE,AMOUNT,AMOUNT_TYPE,DD MON YYYY`.
 * CLAIM → point payment (MMK), REWARD → catalog reward (PERCENTAGE).
 * A bare UUID is also accepted so a typed redemption id works.
 */
export function parseRedemptionQr(text: string): RedemptionQr | { uuidOnly: string } | null {
    const value = text.trim();
    if (UUID.test(value)) return { uuidOnly: value.toLowerCase() };

    const parts = value.split(',').map((p) => p.trim());
    if (parts.length !== 6) return null;
    const type = parts[0].toUpperCase();
    if ((type !== 'CLAIM' && type !== 'REWARD') || !UUID.test(parts[1])) return null;

    return {
        type,
        uuid: parts[1].toLowerCase(),
        memberCode: parts[2],
        amount: parts[3],
        amountType: parts[4],
        date: parts[5],
    };
}
