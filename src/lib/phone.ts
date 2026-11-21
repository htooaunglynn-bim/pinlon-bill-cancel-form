// Myanmar mobile numbers. POST /api/v1/customer/otp/request only accepts `^\+95[0-9]{8,11}$`
// (bim-lpms RequestOtpRequest), so local forms are converted before sending.

export const MM_E164 = /^\+95[0-9]{8,11}$/;

/** "09 123 456 789" / "9123456789" / "959123456789" / "+959123456789" → "+959123456789". */
export function toE164Mm(input: string): string {
    const raw = input.replace(/[\s\-()]/g, '');
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    if (raw.startsWith('95')) return `+${raw}`;
    if (raw.startsWith('0')) return `+95${raw.slice(1)}`;
    if (raw.startsWith('9')) return `+95${raw}`;
    return raw;
}

export function phoneError(input: string): string | undefined {
    const value = toE164Mm(input);
    if (!value) return 'Enter the customer\'s mobile number.';
    if (!MM_E164.test(value)) return 'Enter a Myanmar mobile number, e.g. 09 123 456 789.';
    return undefined;
}
