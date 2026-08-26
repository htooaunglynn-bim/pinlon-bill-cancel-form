import { Link, useParams } from 'react-router-dom';
import { ClayCard } from '@/components/ClayCard';
import { ClayIcon } from '@/components/ClayIcon';
import { useFormulas } from '@/context/FormulasContext';
import { useSession } from '@/context/SessionContext';
import { DepartmentForm } from '@/features/StaffFormulas/DepartmentForm';
import { StaffGate } from '@/features/StaffFormulas/StaffGate';

function NotLoaded() {
    return (
        <ClayCard title="Department not loaded" icon="formulas" tone="lav" delay={0.05}>
            <div className="clay-inset rounded-clay bg-cream/70 px-5 py-7 text-center">
                <ClayIcon name="error" size={40} className="mx-auto" />
                <p className="mt-3 font-display text-[17px] font-semibold">That department isn't loaded</p>
                <p className="mx-auto mt-1.5 max-w-[40ch] text-[15px] text-clay-muted">
                    Departments are identified per session, so this link stops working after a reload.
                    Go back and load the current formulas again.
                </p>
                <Link
                    to="/formulas"
                    className="clay-pressable mt-5 inline-block cursor-pointer rounded-blob bg-lav-deep px-5 py-3 font-display font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lav-deep"
                >
                    Back to formulas
                </Link>
            </div>
        </ClayCard>
    );
}

export function DepartmentPage() {
    const { staffToken } = useSession();
    const { rows } = useFormulas();
    const { id } = useParams();
    const row = rows.find((item) => item.id === id);

    return (
        <div className="max-w-[760px]">
            {!staffToken ? <StaffGate /> : row ? <DepartmentForm key={row.id} row={row} /> : <NotLoaded />}
        </div>
    );
}
