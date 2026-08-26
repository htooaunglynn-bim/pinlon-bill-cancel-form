import { evaluate, identifiers } from '@/lib/formulaEvaluator';
import { RESERVED, VALID_NAME } from '@/lib/constants';
import type { Variables } from '@/lib/types';

export type PreviewResult =
    | { ok: true; points: number; note: string }
    | { ok: false; message: string };

type Input = {
    formula: string;
    variables: Variables;
    amount: number;
    tierMultiplier: number;
    minimumInvoiceAmount: number;
};

/**
 * Applies the same checks, in the same order, as UpdateSettingsRequest — so the preview
 * reports the wording the save endpoint would, before anything is sent.
 */
export function evaluatePreview({ formula: rawFormula, variables, amount, tierMultiplier, minimumInvoiceAmount }: Input): PreviewResult {
    const formula = rawFormula.trim();

    if (formula === '') {
        return { ok: false, message: 'Enter a formula to preview it.' };
    }

    for (const name of Object.keys(variables)) {
        if (RESERVED.includes(name)) {
            return { ok: false, message: `The variable "${name}" is supplied by the system and cannot be redefined.` };
        }
        if (!VALID_NAME.test(name)) {
            return { ok: false, message: `The variable name "${name}" must start with a letter or underscore and contain only letters, numbers and underscores.` };
        }
    }

    const scope = { ...variables, amount, tier_multiplier: tierMultiplier };

    try {
        const unknown = identifiers(formula).filter((name) => !(name in scope));
        if (unknown.length) {
            return { ok: false, message: `The formula uses undefined variable(s): ${unknown.join(', ')}. Declare them under "variables".` };
        }

        if (!identifiers(formula).includes('amount')) {
            return { ok: false, message: 'The formula must use "amount".' };
        }

        // Below the minimum the backend short-circuits to 0 before touching the formula.
        if (amount < minimumInvoiceAmount) {
            return {
                ok: true,
                points: 0,
                note: `Amount is below the ${minimumInvoiceAmount.toLocaleString()} MMK minimum, so no points are earned.`,
            };
        }

        const raw = evaluate(formula, scope);

        if (!Number.isFinite(raw)) {
            return { ok: false, message: 'The formula did not produce a number.' };
        }

        const points = Math.floor(raw);

        return {
            ok: true,
            points,
            note: Number.isInteger(raw)
                ? 'Exact result — no rounding needed.'
                : `Exact result ${raw.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}, rounded down to ${points}.`,
        };
    } catch (error) {
        return { ok: false, message: (error as Error).message };
    }
}
