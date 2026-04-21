import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/landing';
import { GameStart } from './pages/GameStart';
import { GamePlay } from './pages/GamePlay';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { MagicLinkPage } from './pages/MagicLinkPage';
import { BillingSuccessPage } from './pages/BillingSuccessPage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminRoute from './admin/AdminRoute';
import AdminLayout from './admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { PuzzlesPage } from './pages/admin/PuzzlesPage';
import { UsersPage } from './pages/admin/UsersPage';
import { PricingPage } from './pages/admin/PricingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/magic" element={<MagicLinkPage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route
            path="/game-start"
            element={
              <ProtectedRoute>
                <GameStart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <GamePlay />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="puzzles" element={<PuzzlesPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="pricing" element={<PricingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
