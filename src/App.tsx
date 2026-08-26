import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { FormulasProvider } from './context/FormulasContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { FormulasPage } from './pages/FormulasPage';
import { EarnPage } from './pages/EarnPage';
import { DepartmentPage } from './pages/DepartmentPage';

// HashRouter, not BrowserRouter: this app is served ad hoc (opened locally, or from a plain
// static server) with no SPA rewrite rule, where BrowserRouter deep links would 404.
export default function App() {
    return (
        <HashRouter>
            <SessionProvider>
              <FormulasProvider>
                <Routes>
                    <Route element={<DashboardLayout />}>
                        <Route index element={<StaffLoginPage />} />
                        <Route path="formulas" element={<FormulasPage />} />
                        <Route path="formulas/:id" element={<DepartmentPage />} />
                        <Route path="earn" element={<EarnPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
              </FormulasProvider>
            </SessionProvider>
        </HashRouter>
    );
}
