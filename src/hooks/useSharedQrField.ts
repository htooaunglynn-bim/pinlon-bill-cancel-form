import { useCallback, useEffect, useRef, useState } from 'react';
import { useActiveQr } from '@/context/CustomerSessionContext';

/**
 * State for a terminal page's customer-QR field that follows the QR generated on the
 * Mobile page:
 * - starts with `?qr=` from the URL, else the live shared QR;
 * - switches to a newly generated QR while the field is empty or still holds the old one;
 * - clears itself (and flags `expired`) when the shared QR in the field times out;
 * - never overwrites text the user typed or scanned themselves.
 */
export function useSharedQrField(fromUrl: string | null) {
    const { activeQr, clearActiveQr } = useActiveQr();
    const [qr, setQrState] = useState<string>(() => fromUrl ?? activeQr?.qr ?? '');
    const [expired, setExpired] = useState(false);

    const qrRef = useRef(qr);
    qrRef.current = qr;
    const prevShared = useRef<{ qr: string; expiresAt: string } | null>(activeQr ? { qr: activeQr.qr, expiresAt: activeQr.expiresAt } : null);
    const usedHere = useRef(false);

    useEffect(() => {
        const prev = prevShared.current;
        const next = activeQr ? { qr: activeQr.qr, expiresAt: activeQr.expiresAt } : null;
        if (prev?.qr === next?.qr) return;
        prevShared.current = next;

        const current = qrRef.current.trim();
        const heldOld = !!prev && current === prev.qr;

        if (next) {
            if (!current || heldOld) {
                setQrState(next.qr);
                setExpired(false);
            }
            return;
        }

        // The shared QR went away: expired, or spent by an earn/redeem.
        if (heldOld) {
            setQrState('');
            setExpired(!usedHere.current && !!prev && new Date(prev.expiresAt).getTime() <= Date.now() + 1500);
        }
        usedHere.current = false;
    }, [activeQr]);

    const setQr = useCallback((value: string) => {
        setQrState(value);
        setExpired(false);
    }, []);

    /** Call after a successful earn/redeem: the scan token is single use. */
    const markUsed = useCallback(() => {
        if (activeQr && qrRef.current.trim() === activeQr.qr) {
            usedHere.current = true;
            clearActiveQr();
        }
        setQrState('');
    }, [activeQr, clearActiveQr]);

    return { qr, setQr, expired, markUsed, activeQr, isShared: !!activeQr && qr.trim() === activeQr.qr };
}
