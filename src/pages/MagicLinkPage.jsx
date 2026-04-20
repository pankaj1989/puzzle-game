import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function MagicLinkPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyMagicLink } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'pending', error: null });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', error: 'No token in link.' });
      return;
    }
    let active = true;
    (async () => {
      try {
        await verifyMagicLink(token);
        if (!active) return;
        setState({ status: 'ok', error: null });
        navigate('/game-start', { replace: true });
      } catch (err) {
        if (!active) return;
        setState({ status: 'error', error: err.message || 'Link invalid or expired.' });
      }
    })();
    return () => {
      active = false;
    };
  }, [token, verifyMagicLink, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2 text-center">
        {state.status === 'pending' && <p className="text-navy">Verifying your sign-in link…</p>}
        {state.status === 'ok' && <p className="text-navy">Signed in! Redirecting…</p>}
        {state.status === 'error' && (
          <>
            <h1 className="text-2xl font-serif text-navy mb-3">Link problem</h1>
            <p className="text-text-muted mb-6">{state.error}</p>
            <Link to="/login" className="text-brand-orange-dark underline">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
