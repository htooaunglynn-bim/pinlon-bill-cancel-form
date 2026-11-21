// Invoice (bill) QR strings, as parsed by bim-lpms
// app/Http/Requests/V1/Customer/EarnInvoiceQrStringRequest.php and checked by
// QrCodeService::earnInvoicePoints().
//
//   PID,BID,Department,Amount,Date      e.g.  P-0001,BILL-20261121-0001,OPD,25000,21 NOV 2026

import { isRealDate, parseQrDate, toQrDate, yangonToday } from '../dates';
import { commaError, type FieldErrors, hasErrors, parseCsvRows, pidError, requiredText } from './common';

export type InvoiceInput = {
    pid: string;
    bid: string;
    /** Blank means "no department": the QR carries the literal `Null`. */
    department: string;
    amount: string;
    date: string; // YYYY-MM-DD
};

export type InvoiceField = keyof InvoiceInput;

export function newBid(): string {
    const day = yangonToday().replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `BILL-${day}-${rand}`;
}

export function emptyInvoice(): InvoiceInput {
    return { pid: '', bid: newBid(), department: '', amount: '', date: yangonToday() };
}

export type InvoiceWarnings = { amount?: string; date?: string };

export function validateInvoice(input: InvoiceInput): FieldErrors<InvoiceField> {
    const errors: FieldErrors<InvoiceField> = {
        pid: pidError(input.pid),
        bid: requiredText(input.bid, 'Bill ID', 100),
    };

    const dept = input.department.trim();
    if (dept.length > 100) errors.department = 'Department must be at most 100 characters.';
    else errors.department = commaError(dept);

    const amount = Number(input.amount);
    if (!input.amount.trim()) errors.amount = 'Amount is required.';
    else if (!Number.isFinite(amount) || amount < 0.01) errors.amount = 'Amount must be a positive number.';

    if (!input.date || !isRealDate(input.date)) errors.date = 'Enter a valid date.';

    return errors;
}

/** Things the server will reject at claim time, but which are still valid QR strings. */
export function invoiceWarnings(input: InvoiceInput, minimumAmount: number): InvoiceWarnings {
    const warnings: InvoiceWarnings = {};
    const amount = Number(input.amount);
    if (Number.isFinite(amount) && amount > 0 && amount < minimumAmount) {
        warnings.amount = `Below the minimum invoice amount (${minimumAmount.toLocaleString()} MMK). This bill will earn 0 points.`;
    }
    if (input.date && input.date !== yangonToday()) {
        warnings.date = 'Not today (Asia/Yangon). The customer app only accepts bills dated today.';
    }
    return warnings;
}

export function buildInvoiceQr(input: InvoiceInput): string {
    const amount = Number(input.amount);
    return [
        input.pid.trim().toUpperCase(),
        input.bid.trim(),
        input.department.trim() || 'Null',
        Number.isInteger(amount) ? String(amount) : String(input.amount).trim(),
        toQrDate(input.date),
    ].join(',');
}

export type InvoiceBatchRow = {
    line: number;
    input: InvoiceInput;
    errors: FieldErrors<InvoiceField>;
    qr: string | null;
};

/**
 * CSV rows: PID,BID,Department,Amount[,Date]. A blank BID gets a generated one; a blank date
 * means today. Department `Null` or blank means none.
 */
export function parseInvoiceBatch(text: string): InvoiceBatchRow[] {
    return parseCsvRows(text).map((cells, index) => {
        const [pid = '', bid = '', department = '', amount = '', date = ''] = cells;
        const input: InvoiceInput = {
            pid,
            bid: bid || newBid(),
            department: department.toLowerCase() === 'null' ? '' : department,
            amount,
            date: date ? parseQrDate(date) ?? date : yangonToday(),
        };
        const errors = validateInvoice(input);
        if (cells.length < 4 || cells.length > 5) errors.pid = `Expected 4 or 5 columns, got ${cells.length}.`;
        return { line: index + 1, input, errors, qr: hasErrors(errors) ? null : buildInvoiceQr(input) };
    });
}

export function parseInvoiceQr(text: string): InvoiceInput | null {
    const parts = text.split(',').map((p) => p.trim());
    if (parts.length !== 5) return null;
    const [pid, bid, department, amount, date] = parts;
    return {
        pid,
        bid,
        department: department.toLowerCase() === 'null' ? '' : department,
        amount,
        date: parseQrDate(date) ?? date,
    };
}
