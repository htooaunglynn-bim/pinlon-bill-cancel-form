import { ClayInput } from '@/components/ClayInput';
import type { VariableRowState } from '@/lib/types';

type Props = {
    row: VariableRowState;
    onChange: (patch: Partial<VariableRowState>) => void;
    onRemove: () => void;
};

export function VariableRow({ row, onChange, onRemove }: Props) {
    return (
        <div className="mb-2.5 flex items-center gap-2">
            <ClayInput
                mono
                type="text"
                aria-label="Variable name"
                placeholder="percent"
                value={row.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className="flex-[2] !py-2.5"
            />
            <span aria-hidden="true" className="shrink-0 font-display font-semibold text-clay-muted">=</span>
            <ClayInput
                type="number"
                step="any"
                aria-label="Variable value"
                placeholder="100"
                value={row.value}
                onChange={(event) => onChange({ value: event.target.value })}
                className="flex-1 !py-2.5"
            />
            <button
                type="button"
                onClick={onRemove}
                title="Remove variable"
                aria-label={`Remove variable ${row.name || '(unnamed)'}`}
                className="clay-pressable shrink-0 cursor-pointer rounded-full bg-pink px-3.5 py-2 font-display leading-none text-clay-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep"
            >
                &times;
            </button>
        </div>
    );
}
