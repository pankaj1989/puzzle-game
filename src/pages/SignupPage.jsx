import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import GoogleSignInButton from '../auth/GoogleSignInButton';

export function SignupPage({ isModal = false, onClose, onSwitchToLogin }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        email,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  const form = (
    <form onSubmit={onSubmit} className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2">
      {isModal && (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={onClose} className="text-sm text-text-muted2 hover:text-navy">
            Close
          </button>
        </div>
      )}
        <h1 className="text-3xl font-serif text-navy mb-2">Create your account</h1>
        <p className="text-text-muted mb-6">Start decoding license plates.</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block text-sm font-medium text-navy">
            First name
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-card-gray2 rounded-lg focus:outline-none focus:border-brand-orange"
            />
          </label>
          <label className="block text-sm font-medium text-navy">
            Last name
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-card-gray2 rounded-lg focus:outline-none focus:border-brand-orange"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-navy mb-1" htmlFor="email">Email</label>
        <input
          id="email" type="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-card-gray2 rounded-lg mb-4 focus:outline-none focus:border-brand-orange"
        />

        <label className="block text-sm font-medium text-navy mb-1" htmlFor="password">Password</label>
        <input
          id="password" type="password" required minLength={8}
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-card-gray2 rounded-lg mb-2 focus:outline-none focus:border-brand-orange"
        />
        <p className="text-xs text-text-muted2 mb-4">At least 8 characters.</p>

        <label className="block text-sm font-medium text-navy mb-1" htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword" type="password" required minLength={8}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
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
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>

        {googleClientId && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-card-gray2" />
              <span className="text-xs text-text-muted2">OR</span>
              <div className="flex-1 h-px bg-card-gray2" />
            </div>
            <div className="flex justify-center">
              <GoogleSignInButton onError={setError} redirectTo="/" />
            </div>
          </>
        )}

      <p className="text-sm text-text-muted mt-6 text-center">
        Already have an account?{' '}
        {isModal ? (
          <button type="button" onClick={onSwitchToLogin} className="text-brand-orange-dark underline">
            Log in
          </button>
        ) : (
          <Link to="/login" className="text-brand-orange-dark underline">Log in</Link>
        )}
      </p>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6 overflow-y-auto">
        {form}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      {form}
    </div>
  );
}
