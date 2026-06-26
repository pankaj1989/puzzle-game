import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { PremiumPaymentModal } from '../components/common/PremiumPaymentModal';
import { tokenStorage, userStorage, guestStorage } from './storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => userStorage.get());
  const [guestReady, setGuestReady] = useState(() => Boolean(guestStorage.getAccess()));
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const paymentSuccessRef = useRef(null);

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
    guestStorage.clear();
    setGuestReady(false);
    tokenStorage.setTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    userStorage.set(payload.user);
    setUser(payload.user);
  }, []);

  const ensureGuestAuth = useCallback(async () => {
    if (user || tokenStorage.getAccess()) return true;
    const existingId = guestStorage.getId();
    const data = await api.post(
      '/auth/guest',
      existingId ? { guestId: existingId } : {},
      { skipAuth: true }
    );
    guestStorage.set({ guestId: data.guestId, accessToken: data.accessToken });
    setGuestReady(true);
    return true;
  }, [user]);

  const signup = useCallback(
    async (payload) => {
      const data = await api.post('/auth/signup', payload, { skipAuth: true });
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
    guestStorage.clear();
    setGuestReady(false);
    setUser(null);
  }, []);

  const closePremiumPayment = useCallback(() => {
    setPaymentModalOpen(false);
    paymentSuccessRef.current = null;
  }, []);

  const openPremiumPayment = useCallback((onSuccess) => {
    paymentSuccessRef.current = typeof onSuccess === 'function' ? onSuccess : null;
    setPaymentModalOpen(true);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccess()) return null;
    try {
      const { user: fresh } = await api.get('/auth/me');
      userStorage.set(fresh);
      setUser(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const handlePaymentSuccess = useCallback(async () => {
    await refreshUser();
    const cb = paymentSuccessRef.current;
    cb?.();
    closePremiumPayment();
  }, [closePremiumPayment, refreshUser]);

  const startPremiumCheckout = useCallback(
    (onSuccess) => {
      openPremiumPayment(onSuccess);
    },
    [openPremiumPayment]
  );

  const isGuest = !user && guestReady;

  const value = {
    user,
    loading,
    isGuest,
    signup,
    login,
    verifyMagicLink,
    loginWithGoogle,
    logout,
    openPremiumPayment,
    startPremiumCheckout,
    refreshUser,
    ensureGuestAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <PremiumPaymentModal
        isOpen={paymentModalOpen}
        onClose={closePremiumPayment}
        onSuccess={handlePaymentSuccess}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
