import { useNavigate } from 'react-router-dom';
import { ClayButton } from './ClayButton';
import { useSession } from '@/context/SessionContext';

function Badge({ on, children }: { on: boolean; children: React.ReactNode }) {
    return (
        <span
            className={`clay-inset flex items-center gap-2 rounded-blob px-3 py-2 text-xs font-semibold ${
                on ? 'bg-mint/40 text-mint-deep' : 'bg-cream text-clay-muted'
            }`}
        >
            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${on ? 'bg-mint-deep' : 'bg-clay-muted/50'}`} />
            <span className="min-w-0 truncate">{children}</span>
        </span>
    );
}

/** Session status, pinned to the bottom of the sidebar. */
export function SessionPanel() {
    const navigate = useNavigate();
    const { staffToken, staffEmail, customerToken, signOutStaff, signOutCustomer } = useSession();

    function signOut() {
        signOutStaff();
        signOutCustomer();
        navigate('/');
    }

    return (
        <div className="border-t-2 border-dashed border-clay-edge pt-4">
            <p className="mb-2.5 font-display text-xs font-semibold tracking-wide text-clay-muted uppercase">
                Session
            </p>

            <div className="flex flex-col gap-2">
                <Badge on={Boolean(staffToken)}>
                    {staffToken ? `Staff: ${staffEmail ?? 'signed in'}` : 'Staff: signed out'}
                </Badge>
                <Badge on={Boolean(customerToken)}>
                    {customerToken ? 'Customer: session ready' : 'Customer: no session'}
                </Badge>
            </div>

            {staffToken || customerToken ? (
                <ClayButton tone="ghost" type="button" onClick={signOut} className="mt-3 !py-2.5 text-sm">
                    Sign out
                </ClayButton>
            ) : null}
        </div>
    );
}
