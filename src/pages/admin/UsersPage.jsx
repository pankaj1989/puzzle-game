import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

export function UsersPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);

  async function load() {
    try {
      const { users, total } = await adminApi.listUsers({ page, limit: 20, ...(q ? { q } : {}) });
      setRows(users);
      setTotal(total);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function update(id, patch) {
    setError(null);
    try {
      await adminApi.updateUser(id, patch);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Users</h1>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email"
          className="border border-card-gray2 rounded px-3 py-2 flex-1"
        />
        <button className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange">Search</button>
      </form>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</div>
      )}

      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Plan</th>
            <th className="p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u._id} className="border-t border-card-gray2">
              <td className="p-3">{u.email}</td>
              <td className="p-3">
                <select
                  value={u.role}
                  onChange={(e) => update(u._id, { role: e.target.value })}
                  className="border border-card-gray2 rounded px-2 py-1"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="p-3">
                <select
                  value={u.plan}
                  onChange={(e) => update(u._id, { plan: e.target.value })}
                  className="border border-card-gray2 rounded px-2 py-1"
                >
                  <option value="free">free</option>
                  <option value="premium">premium</option>
                </select>
              </td>
              <td className="p-3 text-sm text-text-muted2">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="underline disabled:opacity-40"
        >
          Prev
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * 20 >= total}
          className="underline disabled:opacity-40"
        >
          Next
        </button>
        <span className="text-text-muted2">{total} total</span>
      </div>
    </div>
  );
}
