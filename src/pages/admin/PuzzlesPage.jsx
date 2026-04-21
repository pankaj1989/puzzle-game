import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

const EMPTY = {
  plate: '',
  answer: '',
  categoryId: '',
  difficulty: 'easy',
  clue: '',
  revealSequence: '',
  basePoints: 100,
  timeLimitSeconds: 60,
  isPremium: false,
};

export function PuzzlesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const [pList, cList] = await Promise.all([
        adminApi.listPuzzles({ page, limit: 20 }),
        adminApi.listCategories(),
      ]);
      setRows(pList.puzzles);
      setTotal(pList.total);
      setCategories(cList.categories);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, [page]);

  function openNew() {
    setEditing('new');
    setForm(EMPTY);
    setError(null);
  }

  async function openEdit(id) {
    setError(null);
    try {
      const { puzzle } = await adminApi.getPuzzle(id);
      setEditing(id);
      setForm({
        plate: puzzle.plate,
        answer: puzzle.answer,
        categoryId: String(puzzle.categoryId),
        difficulty: puzzle.difficulty,
        clue: puzzle.clue,
        revealSequence: puzzle.revealSequence.join(','),
        basePoints: puzzle.basePoints,
        timeLimitSeconds: puzzle.timeLimitSeconds,
        isPremium: puzzle.isPremium,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    setError(null);
    const revealSequence = form.revealSequence
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    const body = {
      plate: form.plate.trim(),
      answer: form.answer.trim(),
      categoryId: form.categoryId,
      difficulty: form.difficulty,
      clue: form.clue.trim(),
      revealSequence,
      basePoints: Number(form.basePoints),
      timeLimitSeconds: Number(form.timeLimitSeconds),
      isPremium: !!form.isPremium,
    };
    try {
      if (editing === 'new') await adminApi.createPuzzle(body);
      else await adminApi.updatePuzzle(editing, body);
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(row) {
    if (!confirm(`Delete puzzle ${row.plate}?`)) return;
    try {
      await adminApi.deletePuzzle(row._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif text-navy">Puzzles</h1>
        <button
          onClick={openNew}
          className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange"
        >
          New puzzle
        </button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</div>
      )}

      {editing && (
        <form
          onSubmit={save}
          className="bg-white border border-card-gray2 rounded-xl p-4 mb-6 grid sm:grid-cols-3 gap-3"
        >
          <label>
            Plate
            <input
              className="w-full border rounded px-2 py-1"
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value })}
              required
            />
          </label>
          <label>
            Answer
            <input
              className="w-full border rounded px-2 py-1"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
            />
          </label>
          <label>
            Category
            <select
              className="w-full border rounded px-2 py-1"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select
              className="w-full border rounded px-2 py-1"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            Clue
            <input
              className="w-full border rounded px-2 py-1"
              value={form.clue}
              onChange={(e) => setForm({ ...form, clue: e.target.value })}
              required
            />
          </label>
          <label className="sm:col-span-3">
            Reveal sequence (comma-separated indices)
            <input
              className="w-full border rounded px-2 py-1 font-mono"
              value={form.revealSequence}
              onChange={(e) => setForm({ ...form, revealSequence: e.target.value })}
              required
              placeholder="0,1,2,3"
            />
          </label>
          <label>
            Base points
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={form.basePoints}
              onChange={(e) => setForm({ ...form, basePoints: e.target.value })}
            />
          </label>
          <label>
            Time limit (s)
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={form.timeLimitSeconds}
              onChange={(e) => setForm({ ...form, timeLimitSeconds: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPremium}
              onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
            />
            Premium
          </label>
          <div className="sm:col-span-3 flex gap-2">
            <button type="submit" className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY);
              }}
              className="py-2 px-4 rounded border border-navy text-navy"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Plate</th>
            <th className="p-3">Answer</th>
            <th className="p-3">Difficulty</th>
            <th className="p-3">Premium</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} className="border-t border-card-gray2">
              <td className="p-3 font-mono">{r.plate}</td>
              <td className="p-3">{r.answer}</td>
              <td className="p-3">{r.difficulty}</td>
              <td className="p-3">{r.isPremium ? '★' : ''}</td>
              <td className="p-3 text-right">
                <button
                  onClick={() => openEdit(r._id)}
                  className="text-brand-orange-dark underline text-sm mr-3"
                >
                  Edit
                </button>
                <button onClick={() => remove(r)} className="text-red-600 underline text-sm">
                  Delete
                </button>
              </td>
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
