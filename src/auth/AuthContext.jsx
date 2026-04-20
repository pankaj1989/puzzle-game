import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { tokenStorage, userStorage } from './storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => userStorage.get());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (!tokenStorage.getAccess()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.get('/auth/me');
        if (!active) return;
        setUser(user);
        userStorage.set(user);
      } catch {
        tokenStorage.clear();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const completeAuth = useCallback((payload) => {
    tokenStorage.setTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    userStorage.set(payload.user);
    setUser(payload.user);
  }, []);

  const signup = useCallback(
    async (email, password) => {
      const data = await api.post('/auth/signup', { email, password }, { skipAuth: true });
      completeAuth(data);
      return data.user;
    },
    [completeAuth]
  );

  const login = useCallback(
    async (email, password) => {
      const data = await api.post('/auth/login', { email, password }, { skipAuth: true });
      completeAuth(data);
      return data.user;
    },
    [completeAuth]
  );

  const verifyMagicLink = useCallback(
    async (token) => {
      const data = await api.post('/auth/magic/verify', { token }, { skipAuth: true });
      completeAuth(data);
      return data.user;
    },
    [completeAuth]
  );

  const loginWithGoogle = useCallback(
    async (idToken) => {
      const data = await api.post('/auth/google', { idToken }, { skipAuth: true });
      completeAuth(data);
      return data.user;
    },
    [completeAuth]
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore — local sign-out still happens
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = { user, loading, signup, login, verifyMagicLink, loginWithGoogle, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
