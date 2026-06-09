import { useEffect, useState } from "react";
import { adminApi } from "../../admin/api";

const EMPTY_FORM = { name: "", image: null, isPremium: false };

export function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const { categories } = await adminApi.listCategories();
      setRows(categories);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("isPremium", String(Boolean(form.isPremium)));
      if (form.image) body.append("image", form.image);
      await adminApi.createCategory(body);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePremium(row) {
    try {
      await adminApi.updateCategory(row._id, { isPremium: !row.isPremium });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(row) {
    if (!confirm(`Delete category "${row.name}"?`)) return;
    try {
      await adminApi.deleteCategory(row._id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Categories</h1>

      <form
        onSubmit={create}
        className="bg-white rounded-xl border border-card-gray2 p-4 mb-6 grid sm:grid-cols-4 gap-3 items-end"
      >
        <label className="block text-sm">
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-card-gray2 rounded px-2 py-1"
          />
        </label>
        <label className="block text-sm">
          Category image
          <input
          required
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({ ...form, image: e.target.files?.[0] || null })
            }
            className="w-full border border-card-gray2 rounded px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPremium}
            onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
          />
          Premium
        </label>
        <button
          type="submit"
          disabled={busy}
          className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange disabled:opacity-60"
        >
          {busy ? "Saving…" : "Add"}
        </button>
      </form>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {error}
        </div>
      )}


      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Image</th>
            <th className="p-3">Name</th>
            <th className="p-3">Premium</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} className="border-t border-card-gray2">
              {
                console.log("adasd",r)
              }
              <td className="p-3">
                <img
                // src="http://localhost:4000/categories/1781011402131.png "
                  src={`${import.meta.env.VITE_MEDIAURL}/${r.image}`}
                  alt={r.name}
                  className="h-12 w-12 rounded-lg object-cover border border-card-gray2"
                />
                
              </td>
              <td className="p-3">{r.name}</td>
              <td className="p-3">
                <button
                  onClick={() => togglePremium(r)}
                  className={`text-xs px-2 py-1 rounded ${
                    r.isPremium
                      ? "bg-brand-orange text-white"
                      : "bg-card-gray text-navy"
                  }`}
                >
                  {r.isPremium ? "Premium" : "Free"}
                </button>
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={() => remove(r)}
                  className="text-red-600 text-sm underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
