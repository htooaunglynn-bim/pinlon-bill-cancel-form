import { useState } from 'react';
import { ClayCard } from '@/components/ClayCard';
import { useSession } from '@/context/SessionContext';
import type { BillCancelResult } from '@/lib/types';
import { CancelForm } from './CancelForm';
import { PosTokenPanel } from './PosTokenPanel';
import { ReversalResult } from './ReversalResult';

export function BillCancel() {
    const { posToken, signOutPos } = useSession();
    const [result, setResult] = useState<BillCancelResult | null>(null);

    return (
        <ClayCard
            title="Bill Cancel"
            icon="error"
            tone="pink"
            delay={0.19}
            intro={
                <>
                    <p>
                        Reverses a bill's points effect against the production API: a <strong>refund</strong> takes
                        back points an earn awarded, a <strong>recharge</strong> gives back points a redeem spent.
                        Sending both references voids both legs in one call.
                    </p>
                    <p>
                        Two rules bite first: a bill is cancellable only on the day it happened (Asia/Yangon), and
                        each field searches its own direction &mdash; a reference in the wrong field is refused, never
                        silently reversed.
                    </p>
                </>
            }
        >
            <PosTokenPanel />

            <div className="mt-8 border-t-2 border-dashed border-clay-edge pt-6">
                <h3 className="mb-4 font-display text-lg font-semibold">Cancel a bill</h3>
                <CancelForm posToken={posToken} onResult={setResult} onTokenRejected={signOutPos} />
                {result ? <ReversalResult result={result} /> : null}
            </div>
        </ClayCard>
    );
}
