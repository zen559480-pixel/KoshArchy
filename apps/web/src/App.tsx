import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { isLoggedIn } from './lib/auth';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './routes/LoginPage';
import AppShell from './components/layout/AppShell';
import DashboardPage from './routes/DashboardPage';
import AccountsPage from './routes/AccountsPage';
import TransactionsPage from './routes/TransactionsPage';
import BudgetPage from './routes/BudgetPage';
import GoalsPage from './routes/GoalsPage';
import AnalyticsPage from './routes/AnalyticsPage';
import RecurringPage from './routes/RecurringPage';
import SettingsPage from './routes/SettingsPage';

// ─── Protected layout wrapper ─────────────────────────────────────
function ProtectedLayout() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// ─── Public route guard ───────────────────────────────────────────
function PublicRoute({ children }: { children: React.ReactNode }) {
  if (isLoggedIn()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ─── */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* ── Protected ─── */}
          <Route element={<ProtectedLayout />}>
            <Route path="/"             element={<DashboardPage />} />
            <Route path="/accounts"     element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budget"       element={<BudgetPage />} />
            <Route path="/goals"        element={<GoalsPage />} />
            <Route path="/analytics"    element={<AnalyticsPage />} />
            <Route path="/recurring"    element={<RecurringPage />} />
            <Route path="/settings"     element={<SettingsPage />} />
          </Route>




          {/* ── Catch-all ─── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
