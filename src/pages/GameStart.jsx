import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { getUserFriendlyApiMessage } from '../api/apiErrors';
import { GameStartScreen } from '../components/landing/GameStartScreen';

export function GameStart() {
  const location = useLocation();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const categoryId = location.state?.categoryId || null;
  const categoryName = location.state?.categoryName || '';

  async function startSession() {
    setError(null);
    setStarting(true);
    try {
      const body = categoryId ? { categoryId } : {};
      const data = await api.post('/sessions/start', body);
      navigate(`/game/${data.session.id}`, {
        state: {
          session: data.session,
          puzzle: data.puzzle,
          category: data.category ?? null,
        },
      });
    } catch (err) {
      setError(getUserFriendlyApiMessage(err));
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
        isPremiumFlow={Boolean(categoryId)}
        isStarting={starting}
      />
      {error && (
        <div className="fixed bottom-6 left-1/2 z-modal-top max-w-[min(100vw-2rem,28rem)] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-600 shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}
