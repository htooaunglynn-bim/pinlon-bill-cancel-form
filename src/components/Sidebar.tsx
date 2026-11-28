import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useActiveQr } from '@/context/CustomerSessionContext';
import { mmss } from '@/hooks/useCountdown';
import { useTenant } from '@/context/TenantContext';
import { NAV } from '@/lib/nav';
import { ClayButton } from './ClayButton';
import { ClayIcon } from './ClayIcon';
import { TenantSwitcher } from './TenantSwitcher';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <nav aria-label="Main" className="flex min-h-full flex-col gap-6 px-5 py-7">
            <div className="flex items-center gap-3">
                <ClayIcon name="coin" size={44} float />
                <div>
                    <p className="font-display text-[19px] leading-tight font-bold">
                        Pinlon <span className="text-pink-deep">POS</span>
                    </p>
                    <p className="text-xs text-clay-muted">Admin dashboard</p>
                </div>
            </div>

            <TenantSwitcher />

            <div className="flex flex-1 flex-col gap-5">
                {NAV.map((group, gi) => (
                    <div key={gi}>
                        {group.label ? (
                            <p className="mb-2 px-1 font-display text-xs font-semibold tracking-wide text-clay-muted uppercase">{group.label}</p>
                        ) : null}
                        <ul className="flex flex-col gap-2">
                            {group.items.map((item) => (
                                <li key={item.to}>
                                    <NavLink
                                        to={item.to}
                                        end={item.to === '/' || item.to === '/mobile'}
                                        onClick={onNavigate}
                                        className={({ isActive }) =>
                                            [
                                                'flex items-center gap-3 rounded-blob px-3.5 py-2.5 font-display text-[15px] font-semibold',
                                                'transition-[transform,box-shadow,background-color] duration-150',
                                                'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep',
                                                isActive
                                                    ? 'clay-inset bg-lav text-clay-ink'
                                                    : 'clay-pressable bg-card text-clay-muted hover:text-clay-ink',
                                            ].join(' ')
                                        }
                                    >
                                        <ClayIcon name={item.icon} size={24} />
                                        <span className="flex-1">{item.label}</span>
                                        {item.to === '/mobile' ? <LiveQrBadge /> : null}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <SessionPanel />
        </nav>
    );
}

function SessionPanel() {
    const { user, expiresAt, logout } = useAuth();
    const { tenant } = useTenant();
    const navigate = useNavigate();

    return (
        <div className="border-t-2 border-dashed border-clay-edge pt-4">
            <p className="mb-2 font-display text-xs font-semibold tracking-wide text-clay-muted uppercase">Session</p>
            <div className="clay-inset rounded-blob bg-cream px-3.5 py-2.5 text-sm">
                <p className="font-semibold">{tenant.name}</p>
                <p className="truncate text-xs text-clay-muted">{user} · /{tenant.slug}</p>
                {expiresAt ? (
                    <p className="text-xs text-clay-muted">Until {new Date(expiresAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}</p>
                ) : null}
            </div>
            <ClayButton
                tone="ghost"
                type="button"
                onClick={() => {
                    logout();
                    navigate('/login');
                }}
                className="mt-3 !py-2.5 text-sm"
            >
                Sign out
            </ClayButton>
        </div>
    );
}

/** Countdown next to "Customer app" while a generated POS QR is live. */
function LiveQrBadge() {
    const { activeQr, secondsLeft } = useActiveQr();
    if (!activeQr) return null;
    return (
        <span className="flex items-center gap-1.5 font-mono text-xs text-mint-deep" title={`POS QR for ${activeQr.name} is live`}>
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-mint-deep" />
            {mmss(secondsLeft)}
            <span className="sr-only"> left on the customer POS QR</span>
        </span>
    );
}
