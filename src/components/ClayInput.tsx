import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { mono?: boolean };

export function ClayInput({ className = '', mono = false, ...props }: Props) {
    return (
        <input
            {...props}
            className={[
                'clay-inset w-full rounded-blob border-0 bg-cream px-4 py-3 text-clay-ink',
                'placeholder:text-clay-muted/55',
                'focus:outline-3 focus:outline-offset-2 focus:outline-lav-deep',
                mono ? 'font-mono text-[15px]' : '',
                className,
            ].join(' ')}
        />
    );
}
