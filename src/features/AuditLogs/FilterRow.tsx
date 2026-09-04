import { useId } from 'react';
import type { ReactNode } from 'react';
import { ClayButton } from '@/components/ClayButton';
import { ClayField } from '@/components/ClayField';
import { ClayInput } from '@/components/ClayInput';
import { ClaySelect } from '@/components/ClaySelect';

type ShellProps = {
    children: ReactNode;
    onApply: () => void;
    onReset: () => void;
    busy: boolean;
};

/**
 * The filter panel shell.
 *
 * Text filters are held as a draft and copied over on Apply — with live state
 * every keystroke in a free-text box would refire the request.
 */
export function FilterRow({ children, onApply, onReset, busy }: ShellProps) {
    return (
        <div className="clay-inset rounded-clay bg-cream/70 px-4 py-4">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>

            <div className="mt-4 flex flex-wrap justify-end gap-2.5">
                <ClayButton type="button" tone="ghost" compact onClick={onReset} disabled={busy}>
                    Reset
                </ClayButton>
                <ClayButton type="button" tone="secondary" compact onClick={onApply} disabled={busy}>
                    Apply filters
                </ClayButton>
            </div>
        </div>
    );
}

type TextProps = {
    label: string;
    hint?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'date';
    mono?: boolean;
};

export function FilterText({ label, hint, value, onChange, placeholder, type = 'text', mono = false }: TextProps) {
    const id = useId();

    return (
        <ClayField label={label} hint={hint} htmlFor={id}>
            <ClayInput
                id={id}
                type={type}
                autoComplete="off"
                mono={mono}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </ClayField>
    );
}

type SelectProps = {
    label: string;
    hint?: string;
    value: string;
    onChange: (value: string) => void;
    options: ReadonlyArray<readonly [string, string]>;
};

export function FilterSelect({ label, hint, value, onChange, options }: SelectProps) {
    const id = useId();

    return (
        <ClayField label={label} hint={hint} htmlFor={id}>
            <ClaySelect id={id} value={value} onChange={(event) => onChange(event.target.value)}>
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>{optionLabel}</option>
                ))}
            </ClaySelect>
        </ClayField>
    );
}
