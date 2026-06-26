import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export default function PlayRoute({ children }) {
  const { user, loading, ensureGuestAuth } = useAuth();
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState(null);

  useEffect(() => {
    if (loading || user) return;
    let active = true;
    (async () => {
      setGuestLoading(true);
      setGuestError(null);
      try {
        await ensureGuestAuth();
      } catch {
        if (active) setGuestError('Could not start a guest session. Please try again.');
      } finally {
        if (active) setGuestLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loading, user, ensureGuestAuth]);

  if (loading || guestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-navy">
        <p className="text-lg">Loading game…</p>
      </div>
    );
  }

  if (!user && guestError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-600 max-w-md">{guestError}</p>
        <a href="/?play=1" className="text-brand-orange-dark underline font-medium">
          Back to play
        </a>
      </div>
    );
  }

  return children;
}
