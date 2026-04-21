import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const TABS = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'all', label: 'All time' },
];

export function LeaderboardsPage() {
  const { user } = useAuth();
  const [window, setWindow] = useState('all');
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get(`/leaderboards/${window}`),
      user ? api.get(`/leaderboards/me?window=${window}`) : Promise.resolve(null),
    ])
      .then(([list, me]) => {
        if (!active) return;
        setEntries(list.entries);
        setMyRank(me);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [window, user]);

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif text-navy">Leaderboards</h1>
        <Link to="/game-start" className="text-sm text-brand-orange-dark underline">
          Back to game
        </Link>
      </header>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setWindow(t.key)}
            className={`py-2 px-4 rounded-lg border ${
              window === t.key
                ? 'navy-gradient text-cream border-brand-orange'
                : 'bg-white border-card-gray2 text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {myRank && (
        <div className="mb-4 p-3 bg-cream/60 border border-card-yellow rounded-lg text-sm text-navy">
          Your rank: <strong>{myRank.rank ?? '—'}</strong> · Score: <strong>{myRank.score}</strong>
        </div>
      )}

      {loading && <div>Loading…</div>}
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-text-muted2">No entries yet for this window. Go solve a puzzle!</div>
      )}

      {!loading && entries.length > 0 && (
        <table className="w-full bg-white rounded-xl border border-card-gray2">
          <thead className="text-left text-xs uppercase text-text-muted2">
            <tr>
              <th className="p-3 w-16">#</th>
              <th className="p-3">Player</th>
              <th className="p-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.userId} className="border-t border-card-gray2">
                <td className="p-3 font-bold text-navy">{e.rank}</td>
                <td className="p-3">{e.displayName}</td>
                <td className="p-3 text-right font-mono">{e.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
