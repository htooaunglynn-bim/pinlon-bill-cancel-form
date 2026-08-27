import type { SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

/** Same clay shell as ClayInput, for a native <select>. */
export function ClaySelect({ className = '', children, ...props }: Props) {
    return (
        <select
            {...props}
            className={[
                'clay-inset w-full cursor-pointer appearance-none rounded-blob border-0 bg-cream px-4 py-3 text-clay-ink',
                'focus:outline-3 focus:outline-offset-2 focus:outline-lav-deep',
                className,
            ].join(' ')}
        >
            {children}
        </select>
    );
}
