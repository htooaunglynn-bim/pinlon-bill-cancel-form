import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { configErrors } from '@/config/env';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerSessionProvider } from '@/context/CustomerSessionContext';
import { TenantProvider } from '@/context/TenantContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { BillCancelPage } from '@/pages/BillCancelPage';
import { ConfigMissingPage } from '@/pages/ConfigMissingPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { InvoicePage } from '@/pages/InvoicePage';
import { LoginPage } from '@/pages/LoginPage';
import { LookupPage } from '@/pages/LookupPage';
import { MobilePage } from '@/pages/MobilePage';
import { RewardsPage } from '@/pages/RewardsPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { PointsPage } from '@/pages/PointsPage';
import { RedemptionsPage } from '@/pages/RedemptionsPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
    if (configErrors.length) return <ConfigMissingPage errors={configErrors} />;

    return (
        <HashRouter>
            <AuthProvider>
                <TenantProvider>
                    <CustomerSessionProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route element={<DashboardLayout />}>
                                <Route index element={<OverviewPage />} />
                                <Route path="onboarding" element={<OnboardingPage />} />
                                <Route path="invoice" element={<InvoicePage />} />
                                <Route path="mobile" element={<MobilePage />} />
                                <Route path="mobile/rewards" element={<RewardsPage />} />
                                <Route path="terminal/lookup" element={<LookupPage />} />
                                <Route path="terminal/points" element={<PointsPage />} />
                                <Route path="terminal/bill-cancel" element={<BillCancelPage />} />
                                <Route path="terminal/redemptions" element={<RedemptionsPage />} />
                                <Route path="history" element={<HistoryPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </CustomerSessionProvider>
                </TenantProvider>
            </AuthProvider>
        </HashRouter>
    );
}
