import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy">Loading…</div>;
  }
  if (!user) return <Navigate to="/?auth=login" replace />;
  if (user.role !== 'admin') return <Navigate to="/game-start" replace />;
  return children;
}
