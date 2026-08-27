import type { FormulaRowState, Variables, VariableRowState } from './types';

export function toVarRows(variables: Variables | undefined): VariableRowState[] {
    return Object.entries(variables ?? {}).map(([name, value]) => ({
        id: crypto.randomUUID(),
        name,
        value: String(value),
    }));
}

/** Mirrors the original readVariables(): blank names or values are dropped, the rest coerced. */
export function readVariables(rows: VariableRowState[]): Variables {
    const variables: Variables = {};

    rows.forEach((row) => {
        const name = row.name.trim();
        const value = row.value.trim();
        if (name !== '' && value !== '') variables[name] = Number(value);
    });

    return variables;
}

export function newRow(department = '', formula = '', variables: Variables = {}, locked = false): FormulaRowState {
    return { id: crypto.randomUUID(), department, formula, variables, varRows: toVarRows(variables), locked };
}

export function countVariables(row: FormulaRowState): number {
    return Object.keys(readVariables(row.varRows)).length;
}
