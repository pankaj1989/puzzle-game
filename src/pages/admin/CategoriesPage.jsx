import { useEffect, useRef, useState } from "react";
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
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importFileRef = useRef(null);

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

  function openImport() {
    setImportOpen(true);
    setImportFile(null);
    setImportResult(null);
    setError(null);
  }

  function downloadTemplate() {
    const header = "name,isPremium\n";
    const sample = "Automobile, false\n";
    const blob = new Blob([header + sample], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "category-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitImport(e) {
    e.preventDefault();
    if (!importFile || importBusy) return;
    setImportBusy(true);
    setError(null);
    setImportResult(null);
    try {
      const { summary } = await adminApi.importCategories(importFile);
      setImportResult(summary);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setImportBusy(false);
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
          <button
            type="button"
            onClick={openImport}
            className="ml-2 py-2 px-4 rounded border-2 border-brand-orange text-navy bg-white hover:bg-cream"
          >
            Bulk Import
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-card-gray2 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-serif text-navy">
                  Bulk import categories
                </h2>
                <p className="text-sm text-text-muted2 mt-1">
                  Upload a CSV or Excel file (.csv, .xlsx, .xls).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="text-text-muted2 hover:text-navy"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-text-muted2 mb-3">
              Required columns: <code className="text-navy">name</code>,{" "}
              <code className="text-navy">isPremium</code>.
            </p>

            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm text-brand-orange-dark underline mb-3"
            >
              Download CSV template
            </button>

            {importResult && (
              <div className="rounded-lg border border-card-gray2 bg-cream/40 p-3 text-sm space-y-2 mb-4">
                <p>
                  <strong>{importResult.created}</strong> created ·{" "}
                  <strong>{importResult.updated}</strong> updated ·{" "}
                  <strong>{importResult.failed}</strong> failed
                </p>
                {importResult.errors?.length > 0 && (
                  <ul className="max-h-40 overflow-y-auto text-red-700 space-y-1">
                    {importResult.errors.slice(0, 20).map((item) => (
                      <li key={`${item.row}-${item.name || "err"}`}>
                        Row {item.row}
                        {item.name ? ` (${item.name})` : ""}:{" "}
                        {(item.messages || [item.message]).join("; ")}
                      </li>
                    ))}
                    {importResult.errors.length > 20 && (
                      <li>…and {importResult.errors.length - 20} more</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={submitImport} className="space-y-4 ">
              <input
                ref={importFileRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="text-text-muted2 truncate">
                  {importFile ? importFile.name : "No file selected"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => importFileRef.current.click()}
                    className="block  border border-card-gray2 rounded-md px-2 py-1 w-fit bg-amber-400 cursor-pointer hover:bg-amber-500"
                  >
                    Browse
                  </button>
                  <button
                    type="submit"
                    disabled={!importFile || importBusy}
                    className="py-1 px-3 rounded-md navy-gradient text-cream border-2 border-brand-orange disabled:opacity-50"
                  >
                    {importBusy ? "Importing…" : "Import"}
                  </button>
                </div>
              </div>

              {/* <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  className="py-2 px-4 rounded border border-navy text-navy"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!importFile || importBusy}
                  className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange disabled:opacity-50"
                >
                  {importBusy ? "Importing…" : "Import"}
                </button>
              </div> */}
            </form>
          </div>
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
