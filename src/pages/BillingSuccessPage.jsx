import { Link } from 'react-router-dom';

export function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2">
        <h1 className="text-3xl font-serif text-navy mb-2">You're Premium</h1>
        <p className="text-text-muted mb-6">All categories and puzzles are unlocked.</p>
        <Link
          to="/?play=1"
          className="inline-block py-3 px-6 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange"
        >
          Start playing
        </Link>
      </div>
    </div>
  );
}
