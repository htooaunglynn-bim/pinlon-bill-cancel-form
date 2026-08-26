import { DepartmentList } from '@/features/StaffFormulas/DepartmentList';
import { FormulaPreview } from '@/features/FormulaPreview';

export function FormulasPage() {
    return (
        // At xl the preview sticks alongside the list, so you can try a formula
        // and see the result without scrolling.
        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
            <DepartmentList />
            <div className="xl:sticky xl:top-8">
                <FormulaPreview />
            </div>
        </div>
    );
}
