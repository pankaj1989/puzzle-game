import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

export function PricingPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    stripePriceId: '',
    amountCents: 900,
    currency: 'usd',
    interval: 'month',
  });
  const [error, setError] = useState(null);

  async function load() {
    try {
      const { pricing } = await adminApi.listPricing();
      setRows(pricing);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.upsertPricing({
        stripePriceId: form.stripePriceId.trim(),
        amountCents: Number(form.amountCents),
        currency: form.currency.trim().toLowerCase(),
        interval: form.interval,
      });
      setForm({ stripePriceId: '', amountCents: 900, currency: 'usd', interval: 'month' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Pricing</h1>

      <form
        onSubmit={save}
        className="bg-white rounded-xl border border-card-gray2 p-4 mb-6 grid sm:grid-cols-5 gap-3 items-end"
      >
        <label>
          Stripe Price ID
          <input
            required
            value={form.stripePriceId}
            onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })}
            className="w-full border rounded px-2 py-1 font-mono"
            placeholder="price_..."
          />
        </label>
        <label>
          Amount (cents)
          <input
            type="number"
            min="0"
            required
            value={form.amountCents}
            onChange={(e) => setForm({ ...form, amountCents: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Currency
          <input
            maxLength={3}
            required
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full border rounded px-2 py-1 uppercase"
          />
        </label>
        <label>
          Interval
          <select
            value={form.interval}
            onChange={(e) => setForm({ ...form, interval: e.target.value })}
            className="w-full border rounded px-2 py-1"
          >
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </label>
        <button type="submit" className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange">
          Set active
        </button>
      </form>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</div>
      )}

      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Stripe Price ID</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Currency</th>
            <th className="p-3">Interval</th>
            <th className="p-3">Active</th>
            <th className="p-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} className="border-t border-card-gray2">
              <td className="p-3 font-mono text-sm">{r.stripePriceId}</td>
              <td className="p-3">{(r.amountCents / 100).toFixed(2)}</td>
              <td className="p-3 uppercase">{r.currency}</td>
              <td className="p-3">{r.interval}</td>
              <td className="p-3">{r.active ? '★ active' : ''}</td>
              <td className="p-3 text-sm text-text-muted2">{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
