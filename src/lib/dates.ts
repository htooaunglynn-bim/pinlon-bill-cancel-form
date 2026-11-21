// Every POS date rule on the server uses Asia/Yangon (UTC+6:30, no DST).

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Today's date in Asia/Yangon as YYYY-MM-DD. */
export function yangonToday(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Yangon',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
    return parts; // en-CA formats as YYYY-MM-DD
}

/** YYYY-MM-DD → "14 JUL 2026", the format POS bill QRs print. */
export function toQrDate(iso: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** Accepts "14 JUL 2026" or "2026-07-14" (bim-lpms QrDateParser) and returns YYYY-MM-DD, or null. */
export function parseQrDate(text: string): string | null {
    const value = text.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return isRealDate(value) ? value : null;

    const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(value);
    if (!m) return null;
    const month = MONTHS.indexOf(m[2].toUpperCase());
    if (month < 0) return null;
    const iso = `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return isRealDate(iso) ? iso : null;
}

export function isRealDate(iso: string): boolean {
    const d = new Date(`${iso}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/** YYYY-MM-DD of `iso` minus `years` (for the minimum-age rule). */
export function minusYears(iso: string, years: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(y - years, m - 1, d));
    // Feb 29 rolls to Mar 1 in non-leap years, matching Carbon's subYears overflow.
    return date.toISOString().slice(0, 10);
}

export function whenText(iso: string | null | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatMmk(value: number | string): string {
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toLocaleString()} MMK` : String(value);
}

export function formatPoints(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
