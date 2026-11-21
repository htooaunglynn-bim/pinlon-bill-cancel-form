// Onboarding and family-link QR strings, as parsed by bim-lpms
// app/Http/Requests/V1/Customer/CreateOnboardingQrStringRequest.php (7 parts) and
// CreateLinkQrStringRequest.php (6 or 7 parts).
//
//   PID,Name,FatherName,DOB,Phone,Gender,Baby

import { isRealDate, minusYears, yangonToday } from '../dates';
import { commaError, type FieldErrors, hasErrors, parseCsvRows, PHONE_PATTERN, pidError, requiredText } from './common';

export type OnboardingMode = 'onboarding' | 'link';
export type Gender = 'M' | 'F' | 'other';

export type OnboardingInput = {
    pid: string;
    name: string;
    fatherName: string;
    dob: string; // YYYY-MM-DD
    phone: string;
    gender: Gender;
    baby: boolean;
};

export type OnboardingField = keyof OnboardingInput;

export const EMPTY_ONBOARDING: OnboardingInput = {
    pid: '',
    name: '',
    fatherName: '',
    dob: '',
    phone: '',
    gender: 'M',
    baby: false,
};

export function validateOnboarding(input: OnboardingInput, mode: OnboardingMode, ageLimit: number): FieldErrors<OnboardingField> {
    const errors: FieldErrors<OnboardingField> = {
        pid: pidError(input.pid),
        name: requiredText(input.name, 'Name', 255),
        fatherName: requiredText(input.fatherName, 'Father name', 255),
    };

    const today = yangonToday();
    if (!input.dob) errors.dob = 'Date of birth is required.';
    else if (!isRealDate(input.dob)) errors.dob = 'Enter a valid date.';
    else if (mode === 'onboarding') {
        // Primary member: at least `ageLimit` years old.
        if (input.dob > minusYears(today, ageLimit)) errors.dob = `Customer must be at least ${ageLimit} years old.`;
    } else {
        // Linked dependent: strictly below the age limit and born before today.
        if (input.dob >= today) errors.dob = 'Date of birth must be before today.';
        else if (input.dob <= minusYears(today, ageLimit)) errors.dob = `Linked member must be below the age limit of ${ageLimit}.`;
    }

    const phone = input.phone.trim();
    if (!phone) {
        if (mode === 'onboarding') errors.phone = 'Phone is required.';
    } else if (!PHONE_PATTERN.test(phone)) {
        errors.phone = 'Phone must start with 09 or +959 followed by 7–9 digits.';
    } else {
        errors.phone = commaError(phone);
    }

    return errors;
}

export function buildOnboardingQr(input: OnboardingInput, mode: OnboardingMode): string {
    const parts = [
        input.pid.trim().toUpperCase(),
        input.name.trim(),
        input.fatherName.trim(),
        input.dob,
        // Link QRs may omit the phone; the backend reads blank or "null" as none.
        input.phone.trim() || (mode === 'link' ? 'null' : ''),
        input.gender,
        input.baby ? 'baby' : '',
    ];

    // Link QRs accept 6 parts; drop the empty Baby slot so the string stays short.
    if (mode === 'link' && !input.baby) parts.pop();

    return parts.join(',');
}

export type OnboardingBatchRow = {
    line: number;
    input: OnboardingInput;
    errors: FieldErrors<OnboardingField>;
    qr: string | null;
};

/** CSV rows in the same order as the QR: PID,Name,FatherName,DOB,Phone,Gender[,Baby]. */
export function parseOnboardingBatch(text: string, mode: OnboardingMode, ageLimit: number): OnboardingBatchRow[] {
    return parseCsvRows(text).map((cells, index) => {
        const [pid = '', name = '', fatherName = '', dob = '', phone = '', gender = '', baby = ''] = cells;
        const g = gender.toLowerCase();
        const input: OnboardingInput = {
            pid,
            name,
            fatherName,
            dob,
            phone: phone.toLowerCase() === 'null' ? '' : phone,
            gender: g === 'f' || g === 'female' ? 'F' : g === 'other' ? 'other' : 'M',
            baby: ['baby', 'true', '1', 'yes'].includes(baby.toLowerCase()),
        };
        const errors = validateOnboarding(input, mode, ageLimit);
        if (cells.length < 6 || cells.length > 7) errors.pid = `Expected 6 or 7 columns, got ${cells.length}.`;
        return { line: index + 1, input, errors, qr: hasErrors(errors) ? null : buildOnboardingQr(input, mode) };
    });
}
