import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onError, redirectTo = '/game-start' }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!CLIENT_ID) return null;

  async function handleCredential(response) {
    if (!response?.credential) {
      onError?.('No credential returned from Google');
      return;
    }
    setBusy(true);
    try {
      await loginWithGoogle(response.credential);
      navigate(redirectTo);
    } catch (err) {
      onError?.(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={busy ? 'opacity-60 pointer-events-none' : ''}>
      <GoogleLogin
        onSuccess={handleCredential}
        onError={() => onError?.('Google sign-in failed')}
        useOneTap={false}
      />
    </div>
  );
}
