import { useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "../../admin/api";

const EMPTY = {
  plate: "",
  answer: "",
  categoryId: "",
  difficulty: "easy",
  clue: "",
  basePoints: 100,
  timeLimitSeconds: 60,
  //isPremium: false,
};

export function PuzzlesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importFileRef = useRef(null);

  async function load() {
    try {
      const params = { page, limit: 20 };
      if (categoryId) params.categoryId = categoryId;
      const [pList, cList] = await Promise.all([
        adminApi.listPuzzles(params),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryId]);

  const categoryById = useMemo(() => {
    const m = {};
    for (const c of categories) m[c._id] = c;
    return m;
  }, [categories]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.plate.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function openNew() {
    setEditing("new");
    setForm(EMPTY);
    setError(null);
  }

  async function openEdit(id) {
    setError(null);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    try {
      const { puzzle } = await adminApi.getPuzzle(id);
      setEditing(id);
      setForm({
        plate: puzzle.plate,
        answer: puzzle.answer,
        categoryId: String(puzzle.categoryId),
        difficulty: puzzle.difficulty,
        clue: puzzle.clue,
        basePoints: puzzle.basePoints,
        timeLimitSeconds: puzzle.timeLimitSeconds,
        // isPremium: puzzle.isPremium,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    setError(null);
    const body = {
      plate: form.plate.trim(),
      answer: form.answer.trim(),
      categoryId: form.categoryId,
      difficulty: form.difficulty,
      clue: form.clue.trim(),
      basePoints: Number(form.basePoints),
      timeLimitSeconds: Number(form.timeLimitSeconds),
    };
    try {
      if (editing === "new") await adminApi.createPuzzle(body);
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

  function openImport() {
    setImportOpen(true);
    setImportFile(null);
    setImportResult(null);
    setError(null);
  }

  function downloadTemplate() {
    const header = "plate,answer,category,difficulty,clue,basePoints,timeLimitSeconds,isPremium\n";
    const sample =
      'LV2MRO,love tomorrow,Movies,easy,A romantic outlook on the next day,100,60,false\n';
    const blob = new Blob([header + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "puzzle-import-template.csv";
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
      const { summary } = await adminApi.importPuzzles(importFile);
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-serif text-navy">Puzzles</h1>
        <div>
          <button
            onClick={openNew}
            className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange"
          >
            New puzzle
          </button>

          <button
            type="button"
            onClick={openImport}
            className="ml-2 py-2 px-4 rounded border-2 border-brand-orange text-navy bg-white hover:bg-cream"
          >
            Bulk Import
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plate or answer"
          className="flex-1 min-w-[200px] border border-card-gray2 rounded px-3 py-2"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="border border-card-gray2 rounded px-3 py-2 bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {(search || categoryId) && (
          <button
            onClick={() => {
              setSearch("");
              setCategoryId("");
              setPage(1);
            }}
            className="text-sm text-brand-orange-dark underline"
          >
            Clear
          </button>
        )}
      </div>

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
                <h2 className="text-xl font-serif text-navy">Bulk import puzzles</h2>
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
              Required columns: <code className="text-navy">plate</code>,{" "}
              <code className="text-navy">answer</code>,{" "}
              <code className="text-navy">category</code>,{" "}
              <code className="text-navy">difficulty</code>,{" "}
              <code className="text-navy">clue</code>. Optional:{" "}
              <code className="text-navy">basePoints</code>,{" "}
              <code className="text-navy">timeLimitSeconds</code>,{" "}
              <code className="text-navy">isPremium</code>.
            </p>

            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm text-brand-orange-dark underline mb-4"
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
                        <li key={`${item.row}-${item.plate || "err"}`}>
                          Row {item.row}
                          {item.plate ? ` (${item.plate})` : ""}:{" "}
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

            <form onSubmit={submitImport} className="space-y-4">
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
              onChange={(e) =>
                setForm({ ...form, timeLimitSeconds: e.target.value })
              }
            />
          </label>
          {/* <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPremium}
              onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
            />
            Premium
          </label> */}
          <div className="sm:col-span-3 flex gap-2">
            <button
              type="submit"
              className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange"
            >
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
            <th className="p-3">Category</th>
            <th className="p-3">Difficulty</th>

            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((r) => (
            <tr key={r._id} className="border-t border-card-gray2">
              <td className="p-3 font-mono">{r.plate}</td>
              <td className="p-3">{r.answer}</td>
              <td className="p-3">{categoryById[r.categoryId]?.name || "—"}</td>
              <td className="p-3">{r.difficulty}</td>

              <td className="p-3 text-right">
                <button
                  onClick={() => openEdit(r._id)}
                  className="text-brand-orange-dark underline text-sm mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(r)}
                  className="text-red-600 underline text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredRows.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="p-6 text-center text-text-muted2 text-sm"
              >
                No puzzles match.
              </td>
            </tr>
          )}
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
        <span className="text-text-muted2">
          {total} total{search && ` · ${filteredRows.length} match search`}
        </span>
      </div>
    </div>
  );
}
