import { ClayCard } from '@/components/ClayCard';
import { useSession } from '@/context/SessionContext';
import { CustomerSession } from './CustomerSession';
import { EarnForm } from './EarnForm';

export function EarnTest() {
    const { customerToken, pid, setCustomer, setPid } = useSession();

    return (
        <ClayCard
            title="Earn Test"
            icon="earn"
            tone="pink"
            delay={0.19}
            intro={
                <p>
                    Logs in as a customer via OTP and submits an invoice QR string, optionally with a department,
                    against the production API.
                </p>
            }
        >
            <CustomerSession onToken={setCustomer} onPid={setPid} pid={pid} />

            <div className="mt-8 border-t-2 border-dashed border-clay-edge pt-6">
                <h3 className="mb-4 font-display text-lg font-semibold">Submit invoice QR</h3>
                <EarnForm customerToken={customerToken} pid={pid} onPid={setPid} />
            </div>
        </ClayCard>
    );
}
