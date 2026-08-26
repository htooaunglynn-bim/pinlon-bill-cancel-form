import { useCallback, useState } from 'react';

export type StatusState = 'idle' | 'busy' | 'error' | 'success';

export type Status = {
    state: StatusState;
    text: string;
    /** Secondary lines — the old page's detail() spans. */
    logs: string[];
};

const EMPTY: Status = { state: 'idle', text: '', logs: [] };

/** Replaces the old page's say()/detail() pair. */
export function useStatus() {
    const [status, setStatus] = useState<Status>(EMPTY);

    const say = useCallback((text: string, state: StatusState = 'idle', logs: string[] = []) => {
        setStatus({ state, text, logs });
    }, []);

    const detail = useCallback((text: string) => {
        setStatus((current) => ({ ...current, logs: [...current.logs, text] }));
    }, []);

    return { status, say, detail };
}
