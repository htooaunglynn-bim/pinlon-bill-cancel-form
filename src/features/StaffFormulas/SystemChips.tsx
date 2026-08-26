import { ClayChip } from '@/components/ClayChip';
import { SYSTEM_VARIABLES } from '@/lib/constants';

export function SystemChips() {
    return (
        <div className="mb-3 flex flex-wrap gap-2">
            {SYSTEM_VARIABLES.map(([name, note]) => (
                <ClayChip key={name}>
                    {name} <span className="font-sans text-clay-muted">&mdash; {note}</span>
                </ClayChip>
            ))}
        </div>
    );
}
