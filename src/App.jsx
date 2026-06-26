import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';
import { GameStart } from './pages/GameStart';
import { GamePlay } from './pages/GamePlay';
import { MagicLinkPage } from './pages/MagicLinkPage';
import { BillingSuccessPage } from './pages/BillingSuccessPage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { AuthProvider } from './auth/AuthContext';
import GoogleProvider from './auth/GoogleProvider';
import PlayRoute from './auth/PlayRoute';
import AdminRoute from './admin/AdminRoute';
import AdminLayout from './admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { PuzzlesPage } from './pages/admin/PuzzlesPage';
import { UsersPage } from './pages/admin/UsersPage';
export default function App() {
  return (
    <GoogleProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/magic" element={<MagicLinkPage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route
            path="/game-start"
            element={
              <PlayRoute>
                <GameStart />
              </PlayRoute>
            }
          />
          <Route
            path="/game/:sessionId"
            element={
              <PlayRoute>
                <GamePlay />
              </PlayRoute>
            }
          />
          <Route
            path="/game"
            element={
              <PlayRoute>
                <GamePlay />
              </PlayRoute>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </GoogleProvider>
  );
}
