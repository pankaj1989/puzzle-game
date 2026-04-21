import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { PremiumAdModal } from '../components/common/PremiumAdModal';
import AdSlot from '../ads/AdSlot';

export function GameStart() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cats, sub] = await Promise.all([
          api.get('/categories'),
          api.get('/billing/subscription').catch(() => ({ subscription: null })),
        ]);
        if (!active) return;
        setCategories(cats.categories);
        setSubscription(sub.subscription);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function startSession(categorySlug) {
    setError(null);
    setStarting(true);
    try {
      const body = categorySlug ? { categorySlug } : {};
      const data = await api.post('/sessions/start', body);
      navigate('/game', { state: { session: data.session, puzzle: data.puzzle } });
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  }

  async function openPortal() {
    try {
      const { url } = await api.post('/billing/portal', {});
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Could not open billing portal');
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy">Loading…</div>;
  }

  const isPremium = user?.plan === 'premium';

  return (
    <div className="min-h-screen px-4 py-10 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <h1 className="text-3xl font-serif text-navy">Choose your game</h1>
        <div className="flex items-center gap-3 text-sm text-text-muted flex-wrap">
          {user?.currentStreak > 0 && (
            <span className="px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange text-brand-orange-dark font-semibold">
              🔥 {user.currentStreak}-day streak
            </span>
          )}
          <Link to="/leaderboards" className="underline text-navy">Leaderboards</Link>
          <span>
            Signed in as <strong>{user?.email}</strong>{' '}
            <button onClick={logout} className="ml-2 text-brand-orange-dark underline">
              Sign out
            </button>
          </span>
        </div>
      </header>

      {subscription && (
        <div className="mb-6 p-4 border border-card-gray2 rounded-xl bg-white/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-text-muted">Subscription</div>
            <div className="text-navy">
              <strong className="capitalize">{subscription.status}</strong>
              {subscription.cancelAtPeriodEnd && ' (cancels at period end)'}
              {' · renews '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={openPortal}
            className="py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
          >
            Manage subscription
          </button>
        </div>
      )}

      <div className="mb-8 p-4 bg-cream/60 border border-card-yellow rounded-xl">
        <h2 className="text-xl font-serif text-navy mb-1">Quick play</h2>
        <p className="text-text-muted text-sm mb-3">
          {isPremium ? 'Any puzzle, any category.' : 'A random puzzle from the free pool.'}
        </p>
        <button
          onClick={() => startSession(null)}
          disabled={starting}
          className="py-3 px-6 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange disabled:opacity-60"
        >
          {starting ? 'Starting…' : 'Start random puzzle'}
        </button>
      </div>

      <h2 className="text-xl font-serif text-navy mb-4">Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const premiumOnly = cat.isPremium;
          const locked = premiumOnly && !isPremium;
          return (
            <button
              key={cat._id || cat.id}
              onClick={() => {
                if (locked) setUpsellOpen(true);
                else startSession(cat.slug);
              }}
              disabled={starting}
              className={`p-5 rounded-xl border-2 text-left transition ${
                locked
                  ? 'border-card-gray2 bg-card-gray/40 text-text-muted2 hover:bg-card-gray/60'
                  : 'border-navy bg-white hover:shadow-lg'
              }`}
            >
              <div className="font-semibold text-navy">{cat.name}</div>
              <div className="text-xs mt-1">
                {locked ? '🔒 Premium only — tap to upgrade' : premiumOnly ? '★ Premium' : 'Free'}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <AdSlot slot="1234567890" />

      <PremiumAdModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
}
