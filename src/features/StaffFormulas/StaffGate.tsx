import { Link } from 'react-router-dom';
import { ClayIcon } from '@/components/ClayIcon';

export function StaffGate() {
    return (
        <div className="clay-inset rounded-clay bg-cream/70 px-5 py-7 text-center">
            <ClayIcon name="staff" size={44} className="mx-auto" />
            <p className="mt-3 font-display text-[17px] font-semibold">Log in as staff to continue</p>
            <p className="mx-auto mt-1.5 max-w-[36ch] text-[15px] text-clay-muted">
                Loading and saving department formulas needs an admin staff token. The preview
                scratchpad works without one.
            </p>
            <Link
                to="/"
                className="clay-pressable mt-5 inline-block cursor-pointer rounded-blob bg-lav-deep px-5 py-3 font-display font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lav-deep"
            >
                Go to Staff Login
            </Link>
        </div>
    );
}
