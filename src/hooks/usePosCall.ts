import { useCallback, useState } from 'react';
import { failText, hintFor } from '@/lib/errors';
import type { ApiResult } from '@/lib/types';
import { useStatus } from './useStatus';

/**
 * Runs one POS request and turns its outcome into a status message (error text + hint).
 * Returns the last successful data so the page can render a result panel.
 */
export function usePosCall<T>() {
    const { status, say, clear } = useStatus();
    const [busy, setBusy] = useState(false);
    const [data, setData] = useState<T | null>(null);
    const [last, setLast] = useState<ApiResult<T> | null>(null);

    const run = useCallback(
        async (call: () => Promise<ApiResult<T>>, successText: (data: T, result: ApiResult<T>) => string) => {
            setBusy(true);
            say('Sending…', 'busy');
            const result = await call();
            setBusy(false);
            setLast(result);

            if (result.ok && result.payload.data !== undefined) {
                setData(result.payload.data);
                say(successText(result.payload.data, result), 'success', [`${result.ms} ms`]);
            } else {
                setData(null);
                const code = result.payload.error_code;
                say(failText(result), 'error', [code ? `Code: ${code}` : '', hintFor(result) ?? '']);
            }
            return result;
        },
        [say],
    );

    const reset = useCallback(() => {
        setData(null);
        setLast(null);
        clear();
    }, [clear]);

    return { run, busy, data, last, status, say, reset };
}
