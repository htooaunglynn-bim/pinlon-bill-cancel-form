import { ClayBlobs } from '@/components/ClayBlobs';
import { ClayCard } from '@/components/ClayCard';

export function ConfigMissingPage({ errors }: { errors: readonly string[] }) {
    return (
        <>
            <ClayBlobs />
            <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
                <div className="w-full">
                    <ClayCard
                        title="Configuration missing"
                        icon="error"
                        tone="pink"
                        intro={
                            <p>
                                The dashboard reads its settings from <code>VITE_*</code> environment variables at build time. Copy{' '}
                                <code>.env.example</code> to <code>.env.local</code>, fill it in, and restart the dev server (or rebuild).
                            </p>
                        }
                    >
                        <ul className="clay-inset space-y-2 rounded-blob bg-pink/20 px-5 py-4">
                            {errors.map((e) => (
                                <li key={e} className="font-semibold text-pink-deep">• {e}</li>
                            ))}
                        </ul>
                    </ClayCard>
                </div>
            </div>
        </>
    );
}
