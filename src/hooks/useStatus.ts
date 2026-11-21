import { useCallback, useState } from 'react';

export type StatusState = 'idle' | 'busy' | 'error' | 'success';

export type Status = {
    state: StatusState;
    text: string;
    /** Secondary lines (hints, field errors). */
    logs: string[];
};

const EMPTY: Status = { state: 'idle', text: '', logs: [] };

export function useStatus() {
    const [status, setStatus] = useState<Status>(EMPTY);

    const say = useCallback((text: string, state: StatusState = 'idle', logs: string[] = []) => {
        setStatus({ state, text, logs: logs.filter(Boolean) });
    }, []);

    const clear = useCallback(() => setStatus(EMPTY), []);

    return { status, say, clear };
}
