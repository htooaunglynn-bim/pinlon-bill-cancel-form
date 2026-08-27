import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayField } from '@/components/ClayField';
import { ClayIcon } from '@/components/ClayIcon';
import { ClayInput } from '@/components/ClayInput';
import { useFormulas } from '@/context/FormulasContext';
import { useSession } from '@/context/SessionContext';
import { evaluatePreview } from '@/features/FormulaPreview/evaluatePreview';
import { readVariables } from '@/lib/variables';
import type { FormulaRowState, VariableRowState } from '@/lib/types';
import { SystemChips } from './SystemChips';
import { VariableRow } from './VariableRow';

export function DepartmentForm({ row }: { row: FormulaRowState }) {
    const { patchRow } = useFormulas();
    const { minimumInvoiceAmount } = useSession();
    const navigate = useNavigate();

    // Snapshot on mount so Cancel can put the row back exactly as it was.
    const original = useRef<FormulaRowState>(row);

    const [amount, setAmount] = useState('50000');
    const [tier, setTier] = useState('1');

    const setVarRows = (varRows: VariableRowState[]) => patchRow(row.id, { varRows });

    // Rows created in-app are pinned to the standard formula: only the variable values are tunable.
    const locked = row.locked === true;

    // Same checks, same order, same wording as the save endpoint — so a bad formula
    // surfaces here rather than as a failed PUT.
    const result = useMemo(
        () =>
            evaluatePreview({
                formula: row.formula,
                variables: readVariables(row.varRows),
                amount: Number(amount),
                tierMultiplier: Number(tier),
                minimumInvoiceAmount,
            }),
        [row.formula, row.varRows, amount, tier, minimumInvoiceAmount],
    );

    function cancel() {
        patchRow(row.id, original.current);
        navigate('/formulas');
    }

    return (
        <ClayCard
            title={row.department.trim() || 'New department'}
            icon="formulas"
            tone="lav"
            delay={0.05}
            intro={<p>One department's formula and its variables. Saving happens back on the list.</p>}
        >
            <ClayField label="Department" htmlFor="dept-name" hint={<>(use <code>default</code> for the fallback row)</>}>
                <ClayInput
                    id="dept-name"
                    type="text"
                    placeholder="default"
                    value={row.department}
                    onChange={(event) => patchRow(row.id, { department: event.target.value })}
                />
            </ClayField>

            <ClayField
                label="Formula"
                htmlFor="dept-formula"
                className="mt-4"
                hint={locked ? <>(fixed for new departments)</> : undefined}
            >
                <ClayInput
                    id="dept-formula"
                    mono
                    type="text"
                    spellCheck={false}
                    placeholder="amount * tier_multiplier / percent"
                    value={row.formula}
                    readOnly={locked}
                    aria-readonly={locked || undefined}
                    onChange={locked ? undefined : (event) => patchRow(row.id, { formula: event.target.value })}
                    className={locked ? 'cursor-default bg-cream/60 text-clay-muted' : ''}
                />
            </ClayField>

            <div className="mt-5 border-t-2 border-dashed border-clay-edge pt-4">
                <p className="mb-2.5 font-display text-[15px] font-semibold">Variables</p>
                <SystemChips />

                {row.varRows.map((variableRow) => (
                    <VariableRow
                        key={variableRow.id}
                        row={variableRow}
                        onChange={(patch) =>
                            setVarRows(row.varRows.map((item) => (item.id === variableRow.id ? { ...item, ...patch } : item)))
                        }
                        onRemove={
                            locked ? undefined : () => setVarRows(row.varRows.filter((item) => item.id !== variableRow.id))
                        }
                        lockName={locked}
                    />
                ))}

                {locked ? null : (
                    <ClayButton
                        tone="ghost"
                        compact
                        type="button"
                        onClick={() => setVarRows([...row.varRows, { id: crypto.randomUUID(), name: '', value: '' }])}
                    >
                        + Add variable
                    </ClayButton>
                )}
            </div>

            <div className="mt-5 border-t-2 border-dashed border-clay-edge pt-4">
                <p className="mb-3 font-display text-[15px] font-semibold">
                    Check this formula
                    <span className="ml-1 font-sans text-sm font-normal text-clay-muted">
                        (test values only &mdash; nothing is sent)
                    </span>
                </p>

                <div className="flex gap-3">
                    <ClayField label="Amount (MMK)" htmlFor="dept-amount" className="flex-1">
                        <ClayInput id="dept-amount" type="number" min="0" step="any"
                            value={amount} onChange={(event) => setAmount(event.target.value)} />
                    </ClayField>
                    <ClayField label="Tier multiplier" htmlFor="dept-tier" className="flex-1">
                        <ClayInput id="dept-tier" type="number" min="0" step="any"
                            value={tier} onChange={(event) => setTier(event.target.value)} />
                    </ClayField>
                </div>

                <div
                    aria-live="polite"
                    className={`clay-inset mt-4 rounded-clay px-5 py-5 ${result.ok ? 'bg-mint/25' : 'bg-pink/20'}`}
                >
                    {result.ok ? (
                        <motion.div
                            key={result.points}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ClayIcon name="sparkles" size={26} />
                                <span className="font-display text-[28px] leading-tight font-bold text-mint-deep">
                                    {result.points.toLocaleString()} point{result.points === 1 ? '' : 's'}
                                </span>
                            </div>
                            <p className="mt-1.5 text-sm text-clay-muted">{result.note}</p>
                        </motion.div>
                    ) : (
                        <p className="font-semibold text-pink-deep">{result.message}</p>
                    )}
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <ClayButton type="button" onClick={() => navigate('/formulas')} className="flex-1">Done</ClayButton>
                <ClayButton tone="ghost" type="button" onClick={cancel} className="flex-1">Cancel</ClayButton>
            </div>
        </ClayCard>
    );
}
