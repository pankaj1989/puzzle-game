import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

export function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!stats) return <div>Loading…</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Users total" value={stats.users.total} />
        <Stat label="Premium users" value={stats.users.premium} />
        <Stat label="Puzzles total" value={stats.puzzles.total} />
        <Stat label="Premium puzzles" value={stats.puzzles.premium} />
        <Stat label="Sessions total" value={stats.sessions.total} />
        <Stat label="Solved" value={stats.sessions.solved} />
        <Stat label="Sessions (7d)" value={stats.sessions.last7Days} />
        <Stat label="Active subs" value={stats.subscriptions.active} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-card-gray2 shadow-sm">
      <div className="text-xs uppercase text-text-muted2 tracking-wide">{label}</div>
      <div className="text-3xl font-bold text-navy mt-1">{value}</div>
    </div>
  );
}

function ErrorBox({ message }) {
  return <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{message}</div>;
}
