import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import GoogleSignInButton from '../auth/GoogleSignInButton';

export function LoginPage({ isModal = false, onClose, onSwitchToSignup }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const redirectTo = '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [magicRequested, setMagicRequested] = useState(false);
  const [devLink, setDevLink] = useState(null);

  async function onSubmitLogin(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function onRequestMagic() {
    setError(null);
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    try {
      const res = await api.post('/auth/magic/request', { email }, { skipAuth: true });
      setMagicRequested(true);
      if (res?.devMagicLinkUrl) setDevLink(res.devMagicLinkUrl);
    } catch (err) {
      setError(err.message || 'Could not send magic link');
    }
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const form = (
    <form onSubmit={onSubmitLogin} className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2">
      {isModal && (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={onClose} className="text-sm text-text-muted2 hover:text-navy">
            Close
          </button>
        </div>
      )}
        <h1 className="text-3xl font-serif text-navy mb-2">Welcome back</h1>
        <p className="text-text-muted mb-6">Sign in to continue playing.</p>

        <label className="block text-sm font-medium text-navy mb-1" htmlFor="email">Email</label>
        <input
          id="email" type="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-card-gray2 rounded-lg mb-4 focus:outline-none focus:border-brand-orange"
        />

        <label className="block text-sm font-medium text-navy mb-1" htmlFor="password">Password</label>
        <input
          id="password" type="password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-card-gray2 rounded-lg mb-4 focus:outline-none focus:border-brand-orange"
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <button
          type="submit" disabled={submitting}
          className="w-full py-3 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Log in'}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-card-gray2" />
          <span className="text-xs text-text-muted2">OR</span>
          <div className="flex-1 h-px bg-card-gray2" />
        </div>

        <button
          type="button" onClick={onRequestMagic}
          className="w-full py-3 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
        >
          Email me a sign-in link
        </button>

        {magicRequested && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mt-3">
            If an account exists for {email}, a sign-in link has been sent.
            {devLink && (
              <div className="mt-2">
                <strong>Dev link:</strong>{' '}
                <a href={devLink} className="text-brand-orange-dark underline break-all">{devLink}</a>
              </div>
            )}
          </div>
        )}

        {googleClientId ? (
          <div className="mt-4 flex justify-center">
            <GoogleSignInButton onError={setError} redirectTo={redirectTo} />
          </div>
        ) : (
          <p className="text-xs text-text-muted2 mt-4 text-center">
            Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> to enable Google Sign-In.
          </p>
        )}

      <p className="text-sm text-text-muted mt-6 text-center">
        New here?{' '}
        {isModal ? (
          <button type="button" onClick={onSwitchToSignup} className="text-brand-orange-dark underline">
            Create an account
          </button>
        ) : (
          <Link to="/signup" className="text-brand-orange-dark underline">Create an account</Link>
        )}
      </p>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
        {form}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {form}
    </div>
  );
}
