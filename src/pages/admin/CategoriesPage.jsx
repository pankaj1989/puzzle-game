import { useEffect, useState } from "react";
import { adminApi } from "../../admin/api";

const EMPTY_FORM = { name: "", image: null, isPremium: false };

function categoryImageUrl(image) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return `${import.meta.env.VITE_MEDIAURL}/${image}`;
}

export function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (form.image instanceof File) {
      const url = URL.createObjectURL(form.image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (editing && editingImage) {
      setImagePreview(categoryImageUrl(editingImage));
      return undefined;
    }
    setImagePreview(null);
    return undefined;
  }, [form.image, editing, editingImage]);

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

  function openEdit(row) {
    setEditing(row._id);
    setEditingImage(row.image);
    setForm({
      name: row.name,
      image: null,
      isPremium: Boolean(row.isPremium),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setEditingImage(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function save(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (editing) {
        const body = new FormData();
        body.append("name", form.name.trim());
        body.append("isPremium", String(Boolean(form.isPremium)));
        if (form.image) body.append("image", form.image);
        await adminApi.updateCategory(editing, body);
        cancelEdit();
      } else {
        const body = new FormData();
        body.append("name", form.name.trim());
        body.append("isPremium", String(Boolean(form.isPremium)));
        if (form.image) body.append("image", form.image);
        await adminApi.createCategory(body);
        setForm(EMPTY_FORM);
      }
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
      if (editing === row._id) cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Categories</h1>

      <form
        onSubmit={save}
        className="bg-white rounded-xl border border-card-gray2 p-4 mb-6 grid sm:grid-cols-4 gap-3 items-end"
      >
        <label className="block text-sm sm:col-span-1">
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-card-gray2 rounded px-2 py-1 mt-1"
          />
        </label>
        <label className="block text-sm sm:col-span-1">
          {editing ? "Replace image (optional)" : "Category image"}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Selected category"
              className="h-16 w-16 rounded-lg object-cover border border-card-gray2 my-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            required={!editing}
            onChange={(e) =>
              setForm({ ...form, image: e.target.files?.[0] || null })
            }
            className="w-full border border-card-gray2 rounded px-2 py-1 mt-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-1 sm:pb-2">
          <input
            type="checkbox"
            checked={form.isPremium}
            onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
          />
          Premium
        </label>
        <div className="flex gap-2 sm:col-span-1">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange disabled:opacity-60"
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Add"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={busy}
              className="py-2 px-4 rounded border border-card-gray2 text-navy disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
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
            <th className="p-3 text-right space-x-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} className="border-t border-card-gray2">
              <td className="p-3">
                <img
                  src={categoryImageUrl(r.image)}
                  alt={r.name}
                  className="h-12 w-12 rounded-lg object-cover border border-card-gray2"
                />
              </td>
              <td className="p-3">{r.name}</td>
              {/* <td className="p-3 font-mono text-sm text-text-muted">{r.slug}</td> */}
              <td className="p-3">
                <button
                  type="button"
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
              <td className="p-3 text-right space-x-3">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="text-navy text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="text-red-600 text-sm hover:underline"
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
