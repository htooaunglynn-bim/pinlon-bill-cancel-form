import { useEffect, useState } from 'react';

/** Seconds left until `targetMs` (epoch ms), ticking every second. 0 when unset or passed. */
export function useCountdown(targetMs: number | null): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!targetMs) return;
        setNow(Date.now());
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [targetMs]);

    return targetMs ? Math.max(0, Math.ceil((targetMs - now) / 1000)) : 0;
}

export function mmss(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}
