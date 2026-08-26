import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { StatusMessage } from '@/components/StatusMessage';
import { useFormulas } from '@/context/FormulasContext';
import { useSession } from '@/context/SessionContext';
import { countVariables } from '@/lib/variables';
import type { FormulaRowState } from '@/lib/types';
import { HowFormulasWork } from './HowFormulasWork';
import { StaffGate } from './StaffGate';

function DepartmentItem({ row, onEdit, onRemove }: { row: FormulaRowState; onEdit: () => void; onRemove: () => void }) {
    const count = countVariables(row);
    const name = row.department.trim();

    return (
        <motion.li
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="clay-inset mt-3 rounded-blob bg-cream/70 px-4 py-3.5"
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-display text-[15px] font-semibold">
                        <span className="truncate">{name || <span className="text-clay-muted">Untitled department</span>}</span>
                        {name === 'default' ? (
                            <span className="shrink-0 rounded-full bg-sun px-2 py-0.5 text-[11px] font-semibold text-clay-ink">
                                fallback
                            </span>
                        ) : null}
                    </p>
                    <p className="mt-1 truncate font-mono text-[13px] text-clay-muted">
                        {row.formula.trim() || 'no formula yet'}
                    </p>
                    <p className="mt-1 text-xs text-clay-muted">
                        {count} variable{count === 1 ? '' : 's'}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <ClayButton tone="ghost" compact type="button" onClick={onEdit}>Edit</ClayButton>
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label={`Remove ${name || 'untitled department'}`}
                        title="Remove department"
                        className="clay-pressable cursor-pointer rounded-full bg-pink px-3 py-2 font-display leading-none text-clay-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep"
                    >
                        &times;
                    </button>
                </div>
            </div>
        </motion.li>
    );
}

export function DepartmentList() {
    const { staffToken } = useSession();
    const { rows, loadStatus, saveStatus, dirty, loadFormulas, saveFormulas, addRow, removeRow } = useFormulas();
    const navigate = useNavigate();

    return (
        <ClayCard
            title="Department Formulas"
            icon="formulas"
            tone="lav"
            delay={0.05}
            intro={
                <p>
                    View and edit <code>points.department_formulas</code> via{' '}
                    <code>PUT /api/v1/staff/settings</code>.
                </p>
            }
        >
            {!staffToken ? (
                <StaffGate />
            ) : (
                <>
                    <ClayButton tone="secondary" type="button" onClick={loadFormulas}>
                        Load current formulas
                    </ClayButton>
                    <StatusMessage status={loadStatus} />

                    <HowFormulasWork />

                    {rows.length === 0 ? (
                        <p className="clay-inset mt-4 rounded-blob bg-cream/70 px-4 py-6 text-center text-[15px] text-clay-muted">
                            No departments loaded yet — use <strong className="text-clay-ink">Load current formulas</strong>,
                            or add one below.
                        </p>
                    ) : (
                        <ul className="mt-1">
                            <AnimatePresence initial={false}>
                                {rows.map((row) => (
                                    <DepartmentItem
                                        key={row.id}
                                        row={row}
                                        onEdit={() => navigate(`/formulas/${row.id}`)}
                                        onRemove={() => removeRow(row.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}

                    <ClayButton
                        tone="ghost"
                        type="button"
                        className="mt-3"
                        onClick={() => navigate(`/formulas/${addRow()}`)}
                    >
                        + Add department
                    </ClayButton>

                    <div className="mt-5 border-t-2 border-dashed border-clay-edge pt-4">
                        {dirty ? (
                            <p className="clay-inset mb-3 rounded-blob bg-sun/40 px-4 py-2.5 text-sm font-semibold text-clay-ink">
                                Unsaved changes — Save formulas sends every department at once.
                            </p>
                        ) : null}
                        <ClayButton type="button" onClick={saveFormulas}>Save formulas</ClayButton>
                        <StatusMessage status={saveStatus} />
                    </div>
                </>
            )}
        </ClayCard>
    );
}
