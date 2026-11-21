import { useCallback, useState } from 'react';
import { ClayButton } from './ClayButton';
import { ClayInput } from './ClayInput';
import { QrScannerModal } from './QrScanner';

type Props = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    invalid?: boolean;
    describedBy?: string;
};

/** Text field for a scanned QR string, with a camera/image scan button. USB scanners type into it directly. */
export function QrInput({ id, value, onChange, placeholder, invalid, describedBy }: Props) {
    const [scanning, setScanning] = useState(false);
    const close = useCallback(() => setScanning(false), []);

    return (
        <>
            <div className="flex flex-col gap-2.5 sm:flex-row">
                <ClayInput
                    id={id}
                    mono
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                />
                <ClayButton tone="secondary" compact type="button" onClick={() => setScanning(true)} className="shrink-0 sm:w-auto">
                    Scan
                </ClayButton>
            </div>
            <QrScannerModal open={scanning} onClose={close} onResult={onChange} />
        </>
    );
}
