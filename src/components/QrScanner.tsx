import { AnimatePresence, motion } from 'motion/react';
import QrScannerLib from 'qr-scanner';
import { useEffect, useRef, useState } from 'react';
import { ClayButton } from './ClayButton';

/** Decodes a QR from an uploaded image file. Returns null when no code is found. */
export async function scanImageFile(file: File): Promise<string | null> {
    try {
        const result = await QrScannerLib.scanImage(file, { returnDetailedScanResult: true });
        return result.data || null;
    } catch {
        return null;
    }
}

type Props = {
    open: boolean;
    onClose: () => void;
    onResult: (text: string) => void;
};

/** Camera scanner modal. Falls back to an image upload when there is no camera or permission. */
export function QrScannerModal({ open, onClose, onResult }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !videoRef.current) return;
        setError(null);

        const scanner = new QrScannerLib(
            videoRef.current,
            (result) => {
                scanner.stop();
                onResult(result.data);
                onClose();
            },
            { returnDetailedScanResult: true, highlightScanRegion: true, preferredCamera: 'environment' },
        );

        scanner.start().catch(() => setError('Camera unavailable or permission denied. Upload a photo of the QR instead.'));

        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('keydown', onKey);
            scanner.stop();
            scanner.destroy();
        };
    }, [open, onClose, onResult]);

    async function onFile(file: File | undefined) {
        if (!file) return;
        const text = await scanImageFile(file);
        if (text) {
            onResult(text);
            onClose();
        } else {
            setError('No QR code found in that image.');
        }
    }

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    key="scanner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-clay-ink/45 p-4"
                    onClick={onClose}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Scan QR code"
                        onClick={(e) => e.stopPropagation()}
                        className="clay-surface w-full max-w-md rounded-clay bg-card p-5 sm:p-6"
                    >
                        <h2 className="font-display text-xl font-semibold">Scan QR code</h2>
                        <div className="clay-inset mt-4 overflow-hidden rounded-blob bg-clay-ink/90">
                            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
                        </div>
                        {error ? <p className="mt-3 text-sm font-semibold text-pink-deep">{error}</p> : null}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <label className="clay-pressable flex-1 cursor-pointer rounded-blob bg-sun px-4 py-2.5 text-center font-display text-sm font-semibold focus-within:outline-3 focus-within:outline-lav-deep">
                                Upload image
                                <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
                            </label>
                            <ClayButton tone="ghost" compact type="button" onClick={onClose} className="flex-1">Close</ClayButton>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
