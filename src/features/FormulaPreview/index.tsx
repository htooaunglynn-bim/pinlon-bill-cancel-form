import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ClayButton } from '@/components/ClayButton';
import { ClayCard } from '@/components/ClayCard';
import { ClayField } from '@/components/ClayField';
import { ClayIcon } from '@/components/ClayIcon';
import { ClayInput } from '@/components/ClayInput';
import { SystemChips } from '@/features/StaffFormulas/SystemChips';
import { VariableRow } from '@/features/StaffFormulas/VariableRow';
import { readVariables } from '@/lib/variables';
import { useSession } from '@/context/SessionContext';
import type { VariableRowState } from '@/lib/types';
import { evaluatePreview } from './evaluatePreview';

export function FormulaPreview() {
    const { minimumInvoiceAmount } = useSession();
    const [formula, setFormula] = useState('amount * tier_multiplier / percent');
    const [amount, setAmount] = useState('50000');
    const [tier, setTier] = useState('1');
    const [varRows, setVarRows] = useState<VariableRowState[]>([
        { id: crypto.randomUUID(), name: 'percent', value: '100' },
    ]);

    const result = useMemo(
        () =>
            evaluatePreview({
                formula,
                variables: readVariables(varRows),
                amount: Number(amount),
                tierMultiplier: Number(tier),
                minimumInvoiceAmount,
            }),
        [formula, varRows, amount, tier, minimumInvoiceAmount],
    );

    return (
        <></>
        // <ClayCard
        //     title="Formula Preview"
        //     icon="preview"
        //     tone="mint"
        //     delay={0.12}
        //     intro={
        //         <p>
        //             A scratchpad for trying a formula before you save it. Nothing here is sent to the server &mdash;
        //             once you are happy with a formula, type it into a department row above and save.
        //         </p>
        //     }
        // >
        //     <ClayField label="Formula" htmlFor="preview-formula">
        //         <ClayInput
        //             mono
        //             id="preview-formula"
        //             type="text"
        //             autoComplete="off"
        //             spellCheck={false}
        //             value={formula}
        //             onChange={(event) => setFormula(event.target.value)}
        //         />
        //     </ClayField>

        //     <div className="mt-5 border-t-2 border-dashed border-clay-edge pt-4">
        //         <p className="mb-2.5 font-display text-[15px] font-semibold">Variables</p>
        //         <SystemChips />

        //         {varRows.map((row) => (
        //             <VariableRow
        //                 key={row.id}
        //                 row={row}
        //                 onChange={(patch) => setVarRows((current) => current.map((item) => (item.id === row.id ? { ...item, ...patch } : item)))}
        //                 onRemove={() => setVarRows((current) => current.filter((item) => item.id !== row.id))}
        //             />
        //         ))}

        //         <ClayButton
        //             tone="ghost"
        //             compact
        //             type="button"
        //             onClick={() => setVarRows((current) => [...current, { id: crypto.randomUUID(), name: '', value: '' }])}
        //         >
        //             + Add variable
        //         </ClayButton>
        //     </div>

        //     <div className="mt-5 border-t-2 border-dashed border-clay-edge pt-4">
        //         <p className="mb-3 font-display text-[15px] font-semibold">
        //             Test values
        //             <span className="ml-1 font-sans text-sm font-normal text-clay-muted">
        //                 (what the system would supply at earn time)
        //             </span>
        //         </p>

        //         <div className="flex gap-3">
        //             <ClayField label="Amount (MMK)" htmlFor="preview-amount" className="flex-1">
        //                 <ClayInput
        //                     id="preview-amount" type="number" min="0" step="any"
        //                     value={amount} onChange={(event) => setAmount(event.target.value)}
        //                 />
        //             </ClayField>
        //             <ClayField label="Tier multiplier" htmlFor="preview-tier" className="flex-1">
        //                 <ClayInput
        //                     id="preview-tier" type="number" min="0" step="any"
        //                     value={tier} onChange={(event) => setTier(event.target.value)}
        //                 />
        //             </ClayField>
        //         </div>
        //     </div>

        //     <div
        //         aria-live="polite"
        //         className={`clay-inset mt-6 rounded-clay px-5 py-6 ${result.ok ? 'bg-mint/25' : 'bg-pink/20'}`}
        //     >
        //         {result.ok ? (
        //             <motion.div
        //                 key={result.points}
        //                 initial={{ scale: 0.86, opacity: 0 }}
        //                 animate={{ scale: 1, opacity: 1 }}
        //                 transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        //                 className="text-center"
        //             >
        //                 <div className="flex items-center justify-center gap-2">
        //                     <ClayIcon name="sparkles" size={30} />
        //                     <span className="font-display text-[34px] leading-tight font-bold text-mint-deep">
        //                         {result.points.toLocaleString()} point{result.points === 1 ? '' : 's'}
        //                     </span>
        //                 </div>
        //                 <p className="mt-2 text-sm text-clay-muted">{result.note}</p>
        //             </motion.div>
        //         ) : (
        //             <p className="font-semibold text-pink-deep">{result.message}</p>
        //         )}
        //     </div>
        // </ClayCard>
    );
}
