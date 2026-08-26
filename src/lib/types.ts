export type Variables = Record<string, number>;

export type DepartmentFormula = {
    department: string;
    formula: string;
    variables: Variables;
};

/** A department row as held in React state: same shape plus a stable key. */
export type FormulaRowState = DepartmentFormula & {
    id: string;
    /** Variables are kept as raw strings while editing so a half-typed value isn't coerced. */
    varRows: VariableRowState[];
};

export type VariableRowState = { id: string; name: string; value: string };

export type ApiPayload = {
    success?: boolean;
    message?: string;
    error_code?: string;
    errors?: Record<string, string[]>;
    data?: any;
};

export type ApiResult = { status: number; ok: boolean; payload: ApiPayload };
