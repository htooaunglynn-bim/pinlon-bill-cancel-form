import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSession } from './SessionContext';
import { useStatus } from '@/hooks/useStatus';
import type { Status } from '@/hooks/useStatus';
import { api, fail } from '@/lib/api';
import { newRow, readVariables } from '@/lib/variables';
import type { FormulaRowState } from '@/lib/types';

type Formulas = {
    rows: FormulaRowState[];
    loadStatus: Status;
    saveStatus: Status;
    /** Edited since the last successful load or save. */
    dirty: boolean;

    loadFormulas: () => Promise<void>;
    saveFormulas: () => Promise<void>;
    /** Returns the new row's id so the caller can navigate straight to it. */
    addRow: () => string;
    patchRow: (id: string, patch: Partial<FormulaRowState>) => void;
    removeRow: (id: string) => void;
};

const FormulasContext = createContext<Formulas | null>(null);

// The rows live here rather than in the list component: editing happens on its own route, and
// unmounting the list must not discard unsaved edits.
export function FormulasProvider({ children }: { children: ReactNode }) {
    const { staffToken, setMinimumInvoiceAmount } = useSession();
    const [rows, setRows] = useState<FormulaRowState[]>([]);
    const [dirty, setDirty] = useState(false);
    const load = useStatus();
    const save = useStatus();

    const loadFormulas = useCallback(async () => {
        if (!staffToken) {
            load.say('Log in as staff first.', 'error');
            return;
        }

        load.say('Loading…', 'busy');

        try {
            const { ok, payload } = await api('/api/v1/staff/settings', { token: staffToken });
            if (!ok) throw new Error(fail(payload, 'Could not load settings.'));

            // Keep the preview honest about the tenant's real minimum.
            const minimum = Number(payload.data?.points?.minimum_invoice_amount);
            if (Number.isFinite(minimum)) setMinimumInvoiceAmount(minimum);

            const departments = payload.data?.points?.department_formulas ?? [];
            setRows(
                departments.length === 0
                    ? [newRow('default', 'amount * tier_multiplier / percent', { percent: 100 })]
                    : departments.map((entry: any) => newRow(entry.department ?? '', entry.formula ?? '', entry.variables ?? {})),
            );
            setDirty(false);

            load.say(`Loaded ${departments.length} row(s).`, 'success');
        } catch (error) {
            load.say((error as Error).message || 'Unable to contact the API.', 'error');
        }
    }, [staffToken, setMinimumInvoiceAmount, load]);

    const saveFormulas = useCallback(async () => {
        if (!staffToken) {
            save.say('Log in as staff first.', 'error');
            return;
        }

        const payloadRows = rows
            .map((row) => ({
                department: row.department.trim(),
                formula: row.formula.trim(),
                variables: readVariables(row.varRows),
            }))
            .filter((row) => row.department && row.formula);

        if (payloadRows.length === 0) {
            save.say('Add at least one department/formula row first.', 'error');
            return;
        }

        save.say('Saving…', 'busy');

        try {
            const { ok, payload } = await api('/api/v1/staff/settings', {
                method: 'PUT',
                token: staffToken,
                json: { points: { department_formulas: payloadRows } },
            });
            if (!ok) throw new Error(fail(payload, 'Save failed.'));

            setDirty(false);
            save.say('Saved.', 'success');
        } catch (error) {
            save.say((error as Error).message || 'Unable to contact the API.', 'error');
        }
    }, [staffToken, rows, save]);

    const addRow = useCallback(() => {
        const row = newRow();
        setRows((current) => [...current, row]);
        setDirty(true);
        return row.id;
    }, []);

    const patchRow = useCallback((id: string, patch: Partial<FormulaRowState>) => {
        setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
        setDirty(true);
    }, []);

    const removeRow = useCallback((id: string) => {
        setRows((current) => current.filter((row) => row.id !== id));
        setDirty(true);
    }, []);

    const value = useMemo<Formulas>(
        () => ({
            rows, loadStatus: load.status, saveStatus: save.status, dirty,
            loadFormulas, saveFormulas, addRow, patchRow, removeRow,
        }),
        [rows, load.status, save.status, dirty, loadFormulas, saveFormulas, addRow, patchRow, removeRow],
    );

    return <FormulasContext.Provider value={value}>{children}</FormulasContext.Provider>;
}

export function useFormulas(): Formulas {
    const formulas = useContext(FormulasContext);
    if (!formulas) throw new Error('useFormulas must be used inside <FormulasProvider>.');
    return formulas;
}
