import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function BillingSuccessPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [plan, setPlan] = useState(user?.plan || 'free');

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    async function poll() {
      if (cancelled) return;
      attempts += 1;
      try {
        const { user: fresh } = await api.get('/auth/me');
        if (cancelled) return;
        setPlan(fresh.plan);
        if (fresh.plan === 'premium') {
          setStatus('premium');
          return;
        }
      } catch {
        // transient; will retry
      }
      if (attempts < maxAttempts) {
        setTimeout(poll, 1500);
      } else {
        setStatus('timeout');
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2">
        {status === 'verifying' && (
          <>
            <h1 className="text-2xl font-serif text-navy mb-2">Confirming your upgrade…</h1>
            <p className="text-text-muted mb-6">Stripe is notifying us. This usually takes a few seconds.</p>
          </>
        )}
        {status === 'premium' && (
          <>
            <h1 className="text-3xl font-serif text-navy mb-2">You're Premium 🎉</h1>
            <p className="text-text-muted mb-6">All categories and puzzles are unlocked.</p>
            <Link
              to="/game-start"
              className="inline-block py-3 px-6 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange"
            >
              Start playing
            </Link>
          </>
        )}
        {status === 'timeout' && (
          <>
            <h1 className="text-2xl font-serif text-navy mb-2">Still working on it</h1>
            <p className="text-text-muted mb-4">
              Payment looks successful but we haven't received confirmation yet. Your plan is{' '}
              <strong>{plan}</strong>. Refresh in a minute or contact support.
            </p>
            <Link to="/game-start" className="text-brand-orange-dark underline">Back to game</Link>
          </>
        )}
      </div>
    </div>
  );
}
