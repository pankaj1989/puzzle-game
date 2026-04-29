import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { GameStartScreen } from '../components/landing/GameStartScreen';

export function GameStart() {
  const location = useLocation();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const categorySlug = location.state?.categorySlug || null;
  const categoryName = location.state?.categoryName || 'Random Category';

  async function startSession() {
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

  return (
    <>
      <GameStartScreen
        isOpen
        onBack={() => navigate('/')}
        onStartPlaying={startSession}
        categoryName={categoryName}
        isPremiumFlow={Boolean(categorySlug)}
      />
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      {starting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 text-sm text-navy bg-white border border-card-gray2 rounded px-3 py-2">
          Starting game...
        </div>
      )}
    </>
  );
}
