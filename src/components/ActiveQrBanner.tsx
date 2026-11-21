import { Link } from 'react-router-dom';
import { useActiveQr } from '@/context/CustomerSessionContext';
import { mmss } from '@/hooks/useCountdown';
import { ClayButton } from './ClayButton';
import { ClayChip } from './ClayChip';

type Props = {
    /** Current value of the page's QR field. */
    value: string;
    /** Put the shared QR into the field. */
    onUse: (qr: string) => void;
    /** Empty the field (the shared QR stays available). */
    onDismiss: () => void;
    /** Show an "expired" note after the QR that was in the field timed out. */
    expired?: boolean;
};

/** Shows the QR generated on the Mobile page, so terminal pages need no copy and paste. */
export function ActiveQrBanner({ value, onUse, onDismiss, expired }: Props) {
    const { activeQr, secondsLeft } = useActiveQr();

    if (!activeQr) {
        if (!expired) return null;
        return (
            <div className="clay-inset mb-4 rounded-blob bg-pink/20 px-4 py-3 text-sm">
                <span className="font-semibold text-pink-deep">The customer QR expired.</span>{' '}
                <Link to="/mobile" className="font-semibold text-lav-deep underline">Generate a new one →</Link>
            </div>
        );
    }

    const inUse = value.trim() === activeQr.qr;
    const chipTone = secondsLeft <= 60 ? '!bg-sun' : '!bg-mint/50';
    const who = (
        <>
            <strong>{activeQr.name}</strong> <span className="text-clay-muted">({activeQr.memberCode})</span>
        </>
    );

    return (
        <div className={`clay-inset mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-blob px-4 py-3 text-sm ${inUse ? 'bg-mint/25' : 'bg-lav/25'}`} aria-live="polite">
            {/* Text takes the whole first row on phones; chip + button wrap below it. */}
            <span className="flex w-full min-w-0 items-start gap-2.5 sm:w-auto sm:flex-1">
                <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-mint-deep" />
                <span className="min-w-0">
                    {inUse ? <>Using customer QR for {who}</> : <>Customer QR available for {who}</>}
                </span>
            </span>
            <span className="ml-auto flex items-center gap-2.5 sm:ml-0">
                <ClayChip className={chipTone}>{mmss(secondsLeft)} left</ClayChip>
                {inUse ? (
                    <ClayButton tone="ghost" compact type="button" onClick={onDismiss}>Don't use</ClayButton>
                ) : (
                    <ClayButton tone="primary" compact type="button" onClick={() => onUse(activeQr.qr)}>Use it</ClayButton>
                )}
            </span>
        </div>
    );
}
