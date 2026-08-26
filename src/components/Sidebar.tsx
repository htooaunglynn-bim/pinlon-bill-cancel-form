import { NavLink } from 'react-router-dom';
import { ClayIcon } from './ClayIcon';
import { SessionPanel } from './SessionPanel';
import { NAV } from '@/lib/nav';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <nav aria-label="Main" className="flex h-full flex-col gap-8 px-5 py-7">
            <div className="flex items-center gap-3">
                <ClayIcon name="formulas" size={44} float />
                <div>
                    <p className="font-display text-[19px] leading-tight font-bold">
                        Points, <span className="text-pink-deep">Playfully</span>
                    </p>
                    <p className="text-xs text-clay-muted">Pinlon LPMS harness</p>
                </div>
            </div>

            <ul className="flex flex-1 flex-col gap-2.5">
                {NAV.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            end={item.to === '/'}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 rounded-blob px-3.5 py-3 font-display text-[15px] font-semibold',
                                    'transition-[transform,box-shadow,background-color] duration-150',
                                    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep',
                                    isActive
                                        // Pressed into the clay — the design system already reads this as "current".
                                        ? 'clay-inset bg-lav text-clay-ink'
                                        : 'clay-pressable bg-card text-clay-muted hover:text-clay-ink',
                                ].join(' ')
                            }
                        >
                            <ClayIcon name={item.icon} size={26} />
                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>

            <SessionPanel />
        </nav>
    );
}
