import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ClayBlobs } from '@/components/ClayBlobs';
import { Sidebar } from '@/components/Sidebar';

export function DashboardLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { pathname } = useLocation();
    const drawerRef = useRef<HTMLDivElement | null>(null);

    // Navigating from inside the drawer should close it.
    useEffect(() => { setMenuOpen(false); }, [pathname]);

    useEffect(() => {
        if (!menuOpen) return;

        // Move focus into the drawer so Escape and Tab land inside the dialog.
        drawerRef.current?.focus();

        const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            // Send focus back to the control that opened the drawer.
            document.querySelector<HTMLElement>('button[aria-label="Open navigation menu"]')?.focus();
        };
    }, [menuOpen]);

    return (
        <>
            <ClayBlobs />

            {/* The drawer's only opener now that the topbar is gone. */}
            <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                className="clay-pressable fixed top-4 left-4 z-30 cursor-pointer rounded-blob bg-lav px-3.5 py-3 lg:hidden focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lav-deep"
            >
                <span aria-hidden="true" className="block space-y-1">
                    <span className="block h-0.5 w-5 rounded bg-clay-ink" />
                    <span className="block h-0.5 w-5 rounded bg-clay-ink" />
                    <span className="block h-0.5 w-5 rounded bg-clay-ink" />
                </span>
            </button>

            {/* Desktop: fixed rail. */}
            <div className="fixed inset-y-0 left-0 z-20 hidden w-[264px] overflow-y-auto lg:block">
                <Sidebar />
            </div>

            {/* Mobile: drawer. */}
            <AnimatePresence>
                {menuOpen ? (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 z-40 bg-clay-ink/35 lg:hidden"
                        />
                        <motion.div
                            key="drawer"
                            ref={drawerRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation"
                            tabIndex={-1}
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
                            className="clay-surface fixed inset-y-0 left-0 z-50 w-[272px] overflow-y-auto rounded-r-clay bg-card lg:hidden"
                        >
                            <Sidebar onNavigate={() => setMenuOpen(false)} />
                        </motion.div>
                    </>
                ) : null}
            </AnimatePresence>

            <div className="lg:pl-[264px]">
                {/* Extra top padding below lg leaves room for the floating menu button. */}
                <div className="mx-auto w-full max-w-[1180px] px-4 pt-20 pb-8 sm:px-6 lg:pt-8">
                    <main>
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    );
}
