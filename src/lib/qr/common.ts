// Shared helpers for the comma-separated QR strings the POS prints and the backend parses.

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export const PID_PATTERN = /^[A-Z0-9-]+$/;
export const PHONE_PATTERN = /^(09|\+959)\d{7,9}$/;

/** The backend splits on ",", so a comma inside any field silently shifts every later field. */
export function commaError(value: string): string | undefined {
    return value.includes(',') ? 'Commas are not allowed (the QR is comma-separated).' : undefined;
}

export function pidError(pid: string): string | undefined {
    const v = pid.trim().toUpperCase();
    if (!v) return 'PID is required.';
    if (v.length > 20) return 'PID must be at most 20 characters.';
    if (!PID_PATTERN.test(v)) return 'PID may only contain A–Z, 0–9 and "-".';
    return undefined;
}

export function requiredText(value: string, label: string, max: number): string | undefined {
    const v = value.trim();
    if (!v) return `${label} is required.`;
    if (v.length > max) return `${label} must be at most ${max} characters.`;
    return commaError(v);
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
    return Object.values(errors).some(Boolean);
}

/** Splits a CSV block into rows of trimmed cells. Blank lines and `#` comments are skipped. */
export function parseCsvRows(text: string): string[][] {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => line.split(',').map((cell) => cell.trim()));
}
