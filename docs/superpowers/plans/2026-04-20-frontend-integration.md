# Frontend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing React/Vite frontend to the backend API built in Plans 1–2, so users can sign up, log in, play puzzles, submit guesses, and see server-computed scores entirely through the browser.

**Architecture:** A thin `api/client.js` wraps `fetch` with automatic Bearer-token injection and silent 401-refresh. Auth state lives in a single `AuthContext` provider (React Context + `useState` — no extra state lib) and persists access/refresh tokens in `localStorage`. Existing landing page stays intact; new routes are added for `/signup`, `/login`, `/auth/magic`, with a `<ProtectedRoute>` wrapper for `/game-start` and `/game`. The existing `GameStart.jsx` + `GamePlay.jsx` are refactored to fetch live data from the backend. A small backend tweak exposes the magic-link URL in the dev-mode response so local testing works without SendGrid.

**Tech Stack:**
- Existing: React 19, React Router 7, Tailwind v4, Vite 8, react-icons
- New (dependencies): none — uses native `fetch`
- Optional: `@react-oauth/google` for the Google Sign-In button (only if user sets `VITE_GOOGLE_CLIENT_ID`)

---

## File Structure

```
/                                     (repo root — frontend)
├── .env.local                        # NEW: VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID (gitignored)
├── .env.local.example                # NEW: documents the two vars
└── src/
    ├── api/
    │   └── client.js                 # NEW: fetchJson, apiPost/Get/Patch with auth + refresh
    ├── auth/
    │   ├── storage.js                # NEW: localStorage wrappers for tokens + user
    │   ├── AuthContext.jsx           # NEW: provider + useAuth hook
    │   └── ProtectedRoute.jsx        # NEW: redirect to /login if no user
    ├── pages/
    │   ├── SignupPage.jsx            # NEW: email/password signup
    │   ├── LoginPage.jsx             # NEW: email/password login + magic-link request + Google button
    │   ├── MagicLinkPage.jsx         # NEW: /auth/magic?token=... verifies + signs in
    │   ├── GameStart.jsx             # MODIFY: fetch /categories, handle free vs premium flow
    │   └── GamePlay.jsx              # MODIFY: read session from router state, submit guesses to API
    ├── components/
    │   └── common/
    │       └── Toast.jsx             # NEW: simple inline error/success display
    └── App.jsx                       # MODIFY: wrap in AuthProvider, add auth + protected routes

server/
└── src/
    └── controllers/
        └── authController.js         # MODIFY: include devMagicLinkUrl in /auth/magic/request when NODE_ENV !== production
```

**Notes:**
- No new test infra on the frontend yet (deliberate — ship first). Each task has a **manual verification** step the user performs in the browser.
- Tokens in `localStorage`. Known XSS tradeoff; acceptable for a game app's v1.
- `ProtectedRoute` wraps `/game-start` and `/game` — users must be authenticated to play.

---

## Conventions

- All paths relative to repo root.
- Frontend dev: `npm run dev` (port 5173). Backend dev: `cd server && npm run dev` (port 4000).
- MongoDB must be running (already covered in Plan 2).
- Each task ends in 1 commit on the current feature branch.
- No TDD (no frontend test infra); each task has manual-verification steps instead.
- **Verification command for all backend checks:** use curl or the browser devtools network tab. Backend is at `http://localhost:4000`, frontend at `http://localhost:5173`.

---

## Task 1: Dev-mode magic link in backend response

**Files:**
- Modify: `server/src/controllers/authController.js` (magicRequest handler)

**Why first:** the frontend's magic-link page needs a way to get the token without SendGrid sending real email. In dev, return the URL directly in the response. Production code path stays unchanged.

- [ ] **Step 1: Edit `server/src/controllers/authController.js`**

Find the `magicRequest` function. Replace its body so that in non-production, the magic-link URL is returned alongside `{ ok: true }`. In production, behavior is unchanged.

Replace:
```js
async function magicRequest(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.MAGIC_LINK_TTL_MINUTES * 60 * 1000);
    await MagicLinkToken.create({ email, tokenHash: hashSha(token), expiresAt });
    const link = `${env.MAGIC_LINK_REDIRECT_URL}?token=${token}`;
    await emailService.sendMagicLink(email, link);
  }
  res.status(202).json({ ok: true });
}
```

With:
```js
async function magicRequest(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });
  const payload = { ok: true };
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.MAGIC_LINK_TTL_MINUTES * 60 * 1000);
    await MagicLinkToken.create({ email, tokenHash: hashSha(token), expiresAt });
    const link = `${env.MAGIC_LINK_REDIRECT_URL}?token=${token}`;
    await emailService.sendMagicLink(email, link);
    if (env.NODE_ENV !== 'production') {
      payload.devMagicLinkUrl = link;
    }
  }
  res.status(202).json(payload);
}
```

- [ ] **Step 2: Run backend tests**

```bash
cd server && npm test
```
Expected: all 97 tests still pass (existing magic-link tests don't assert on absence of `devMagicLinkUrl`).

- [ ] **Step 3: Manual verification**

Backend is running at localhost:4000. Run:
```bash
curl -s -X POST http://localhost:4000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"m@test.com","password":"password123"}' > /dev/null

curl -s -X POST http://localhost:4000/auth/magic/request \
  -H 'Content-Type: application/json' \
  -d '{"email":"m@test.com"}' | python3 -m json.tool
```

Expected output includes:
```json
{"ok": true, "devMagicLinkUrl": "http://localhost:5173/auth/magic?token=<hex>"}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/authController.js
git commit -m "feat(server): return devMagicLinkUrl on /auth/magic/request in non-prod"
```

---

## Task 2: Frontend env vars + `.env.local.example`

**Files:**
- Create: `.env.local` (gitignored — has real values)
- Create: `.env.local.example` (committed — documents vars)
- Modify: `.gitignore` (verify `.env.local` is ignored — probably already is via `*.local`)

- [ ] **Step 1: Create `.env.local`** (used by Vite, gitignored)

```
VITE_API_BASE_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=
```

Leave `VITE_GOOGLE_CLIENT_ID` empty for now — the Google button will be hidden.

- [ ] **Step 2: Create `.env.local.example`**

```
# Where the backend lives
VITE_API_BASE_URL=http://localhost:4000

# Optional: Google OAuth Web Client ID.
# If empty, the Google Sign-In button is hidden.
# Create one at https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID=
```

- [ ] **Step 3: Verify `.gitignore`**

Run:
```bash
git check-ignore .env.local && echo "IGNORED" || echo "NOT_IGNORED"
```

Expected: `IGNORED` (the existing `.gitignore` has `*.local`).

- [ ] **Step 4: Commit**

```bash
git add .env.local.example
git commit -m "chore: document frontend env vars in .env.local.example"
```

---

## Task 3: Auth storage module

**Files:**
- Create: `src/auth/storage.js`

- [ ] **Step 1: Create the file**

```js
const ACCESS_KEY = 'bs.accessToken';
const REFRESH_KEY = 'bs.refreshToken';
const USER_KEY = 'bs.user';

export const tokenStorage = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStorage = {
  get() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  set(user) {
    if (!user) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};
```

- [ ] **Step 2: Manual verification**

Open browser devtools → Application → Local Storage → localhost:5173. (Nothing to see yet; just confirm the file imports without errors when we use it.)

- [ ] **Step 3: Commit**

```bash
git add src/auth/storage.js
git commit -m "feat(frontend): add auth token + user localStorage wrappers"
```

---

## Task 4: API client

**Files:**
- Create: `src/api/client.js`

The API client wraps `fetch`:
- Prepends `VITE_API_BASE_URL`
- Adds `Authorization: Bearer <access>` when available
- On 401, tries `/auth/refresh` once, retries the original request
- On any failure, throws a structured `ApiError`

- [ ] **Step 1: Create the file**

```js
import { tokenStorage } from '../auth/storage';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function doFetch(path, { method = 'GET', body, headers = {}, skipAuth = false } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (!skipAuth) {
    const access = tokenStorage.getAccess();
    if (access) finalHeaders.Authorization = `Bearer ${access}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function parseOrThrow(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    const err = json?.error || {};
    throw new ApiError(res.status, err.code || 'ERROR', err.message || `HTTP ${res.status}`, err);
  }
  return json;
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new ApiError(401, 'NO_REFRESH', 'Not signed in');
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await parseOrThrow(res);
      tokenStorage.setTokens({
        accessToken: json.accessToken,
        refreshToken: json.refreshToken,
      });
      return json.accessToken;
    } catch (err) {
      tokenStorage.clear();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest(path, opts = {}) {
  let res = await doFetch(path, opts);
  if (res.status === 401 && !opts.skipAuth && tokenStorage.getRefresh()) {
    try {
      await refreshAccessToken();
      res = await doFetch(path, opts); // retry once
    } catch {
      // fall through to parseOrThrow on the original 401
    }
  }
  return parseOrThrow(res);
}

export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body }),
};
```

- [ ] **Step 2: Manual verification**

Open `http://localhost:5173` in the browser, open devtools console, paste:
```js
fetch('http://localhost:4000/health').then(r => r.json()).then(console.log)
```
Expected: `{status: 'ok'}`. Confirms CORS + backend reachability.

- [ ] **Step 3: Commit**

```bash
git add src/api/client.js
git commit -m "feat(frontend): api client with bearer auth + refresh-on-401"
```

---

## Task 5: Auth context + provider

**Files:**
- Create: `src/auth/AuthContext.jsx`

- [ ] **Step 1: Create the file**

```jsx
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
    return () => { active = false; };
  }, []);

  const completeAuth = useCallback((payload) => {
    tokenStorage.setTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    userStorage.set(payload.user);
    setUser(payload.user);
  }, []);

  const signup = useCallback(async (email, password) => {
    const data = await api.post('/auth/signup', { email, password }, { skipAuth: true });
    completeAuth(data);
    return data.user;
  }, [completeAuth]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password }, { skipAuth: true });
    completeAuth(data);
    return data.user;
  }, [completeAuth]);

  const verifyMagicLink = useCallback(async (token) => {
    const data = await api.post('/auth/magic/verify', { token }, { skipAuth: true });
    completeAuth(data);
    return data.user;
  }, [completeAuth]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const data = await api.post('/auth/google', { idToken }, { skipAuth: true });
    completeAuth(data);
    return data.user;
  }, [completeAuth]);

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
```

- [ ] **Step 2: Manual verification**

No UI change yet; just compile-check. Run `npm run dev` (if not already running) and verify no console errors in the browser.

- [ ] **Step 3: Commit**

```bash
git add src/auth/AuthContext.jsx
git commit -m "feat(frontend): auth context with signup/login/magic/google/logout"
```

---

## Task 6: Protected route wrapper

**Files:**
- Create: `src/auth/ProtectedRoute.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-navy">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/ProtectedRoute.jsx
git commit -m "feat(frontend): ProtectedRoute wrapper"
```

---

## Task 7: Wire AuthProvider + new routes in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Read current `src/App.jsx`**

Open the file. It currently has:
```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/game-start" element={<GameStart />} />
    <Route path="/game" element={<GamePlay />} />
  </Routes>
</BrowserRouter>
```
(Approximate — adjust based on actual content.)

- [ ] **Step 2: Replace `src/App.jsx` contents**

```jsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LandingPage from './components/landing/LandingPage';
import GameStart from './pages/GameStart';
import GamePlay from './pages/GamePlay';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import MagicLinkPage from './pages/MagicLinkPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/magic" element={<MagicLinkPage />} />
          <Route
            path="/game-start"
            element={
              <ProtectedRoute>
                <GameStart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <GamePlay />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

If the current file has additional imports (e.g., CSS, layout wrappers), preserve them.

- [ ] **Step 3: Manual verification**

Visit `http://localhost:5173/game-start`. You should be redirected to `/login` (which doesn't exist yet — you'll see a blank page or "Cannot GET" error). That confirms the protected route is active. The rest of the pages get created in the following tasks.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(frontend): add auth routes + protect game routes"
```

---

## Task 8: Signup page

**Files:**
- Create: `src/pages/SignupPage.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password);
      navigate('/game-start');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2">
        <h1 className="text-3xl font-serif text-navy mb-2">Create your account</h1>
        <p className="text-text-muted mb-6">Start decoding license plates.</p>

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

        <p className="text-sm text-text-muted mt-6 text-center">
          Already have an account? <Link to="/login" className="text-brand-orange-dark underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Visit `http://localhost:5173/signup`. Fill in an email + password and submit. Expected:
- On success, you're redirected to `/game-start` (which doesn't fully work yet, but no redirect loop).
- Check devtools → Application → Local Storage: `bs.accessToken`, `bs.refreshToken`, `bs.user` are all set.
- Test error handling: submit with password `short`. You should see the backend's validation error inline.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SignupPage.jsx
git commit -m "feat(frontend): signup page with inline errors"
```

---

## Task 9: Login page (email/password + magic link request)

**Files:**
- Create: `src/pages/LoginPage.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/game-start';

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
      navigate(redirectTo);
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmitLogin} className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2">
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
          <p className="text-xs text-text-muted2 mt-4 text-center">
            Google Sign-In is configured — see your dev tools (not yet implemented on this page).
          </p>
        ) : (
          <p className="text-xs text-text-muted2 mt-4 text-center">
            Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> to enable Google Sign-In.
          </p>
        )}

        <p className="text-sm text-text-muted mt-6 text-center">
          New here? <Link to="/signup" className="text-brand-orange-dark underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Visit `http://localhost:5173/login`. Test:

1. **Correct credentials** (use the `m@test.com` / `password123` from Task 1 verification): submitting redirects to `/game-start`.
2. **Wrong password**: "Invalid credentials" inline.
3. **Magic link button**: enter `m@test.com`, click "Email me a sign-in link". You should see the "dev link" section with a clickable URL. Click it — the next task (MagicLinkPage) will handle it.

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.jsx
git commit -m "feat(frontend): login page with email+password and magic-link request"
```

---

## Task 10: Magic-link callback page

**Files:**
- Create: `src/pages/MagicLinkPage.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function MagicLinkPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyMagicLink } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'pending', error: null });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', error: 'No token in link.' });
      return;
    }
    let active = true;
    (async () => {
      try {
        await verifyMagicLink(token);
        if (!active) return;
        setState({ status: 'ok', error: null });
        navigate('/game-start', { replace: true });
      } catch (err) {
        if (!active) return;
        setState({ status: 'error', error: err.message || 'Link invalid or expired.' });
      }
    })();
    return () => { active = false; };
  }, [token, verifyMagicLink, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2 text-center">
        {state.status === 'pending' && <p className="text-navy">Verifying your sign-in link…</p>}
        {state.status === 'ok' && <p className="text-navy">Signed in! Redirecting…</p>}
        {state.status === 'error' && (
          <>
            <h1 className="text-2xl font-serif text-navy mb-3">Link problem</h1>
            <p className="text-text-muted mb-6">{state.error}</p>
            <Link to="/login" className="text-brand-orange-dark underline">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

From the Login page, request a magic link, then click the dev link. You should see "Verifying…" briefly, then be redirected to `/game-start`. Check `localStorage` — tokens set.

To test error path: manually visit `http://localhost:5173/auth/magic?token=invalid`. You should see "Link problem" with "Invalid or expired token" message.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MagicLinkPage.jsx
git commit -m "feat(frontend): magic link verify page"
```

---

## Task 11: Refactor GameStart — fetch categories + create session

**Files:**
- Modify: `src/pages/GameStart.jsx`

- [ ] **Step 1: Read current `src/pages/GameStart.jsx`**

See what's there now (GameStartScreen + CategorySelection components, pure client-side state). You'll replace the flow with real API calls.

- [ ] **Step 2: Replace `src/pages/GameStart.jsx` contents**

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function GameStart() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { categories } = await api.get('/categories');
        setCategories(categories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function startSession(categorySlug) {
    setError(null);
    setStarting(true);
    try {
      const body = categorySlug ? { categorySlug } : {};
      const data = await api.post('/sessions/start', body);
      navigate('/game', { state: { session: data.session, puzzle: data.puzzle } });
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy">Loading…</div>;
  }

  const isPremium = user?.plan === 'premium';

  return (
    <div className="min-h-screen px-4 py-10 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-navy">Choose your game</h1>
        <div className="text-sm text-text-muted">
          Signed in as <strong>{user.email}</strong>{' '}
          <button onClick={logout} className="ml-2 text-brand-orange-dark underline">Sign out</button>
        </div>
      </header>

      <div className="mb-8 p-4 bg-cream/60 border border-card-yellow rounded-xl">
        <h2 className="text-xl font-serif text-navy mb-1">Quick play</h2>
        <p className="text-text-muted text-sm mb-3">
          {isPremium ? 'Any puzzle, any category.' : 'A random puzzle from the free pool.'}
        </p>
        <button
          onClick={() => startSession(null)} disabled={starting}
          className="py-3 px-6 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange disabled:opacity-60"
        >
          {starting ? 'Starting…' : 'Start random puzzle'}
        </button>
      </div>

      <h2 className="text-xl font-serif text-navy mb-4">Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {categories.map(cat => {
          const premiumOnly = cat.isPremium;
          const locked = premiumOnly && !isPremium;
          return (
            <button
              key={cat._id || cat.id}
              onClick={() => !locked && startSession(cat.slug)}
              disabled={locked || starting}
              className={`p-5 rounded-xl border-2 text-left transition ${
                locked
                  ? 'border-card-gray2 bg-card-gray/40 text-text-muted2 cursor-not-allowed'
                  : 'border-navy bg-white hover:shadow-lg'
              }`}
            >
              <div className="font-semibold text-navy">{cat.name}</div>
              <div className="text-xs mt-1">
                {locked ? '🔒 Premium only' : premiumOnly ? '★ Premium' : 'Free'}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Visit `/game-start` while signed in (as a free user). You should see:
- "Quick play" box with a "Start random puzzle" button.
- Grid of 6 category cards. Three (Movies, Music, Technology) are free and clickable. Three (Food, Animals, Random) show "🔒 Premium only" and are greyed out.

Click "Start random puzzle" → routed to `/game` (which doesn't work yet — next task). Clicking a free category also routes to `/game`.

Test premium-only click error: open devtools Network, click a locked category — it shouldn't fire (disabled). To test 403: temporarily remove `disabled={locked}` in code, click Food. You should see a 403 `PLAN_REQUIRED` error inline. Restore disabled afterward.

- [ ] **Step 4: Commit**

```bash
git add src/pages/GameStart.jsx
git commit -m "feat(frontend): GameStart fetches categories and starts sessions"
```

---

## Task 12: Refactor GamePlay — live session, timer, guess submission

**Files:**
- Modify: `src/pages/GamePlay.jsx`

- [ ] **Step 1: Read current `src/pages/GamePlay.jsx`**

See existing component structure (11 letter inputs, hardcoded clue, PremiumAdModal).

- [ ] **Step 2: Replace `src/pages/GamePlay.jsx` contents**

This replaces the entire file. The new version drives everything from the session data received via router state.

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function GamePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state;

  // If a user hard-navigates to /game, bounce them back
  useEffect(() => {
    if (!initial?.session || !initial?.puzzle) {
      navigate('/game-start', { replace: true });
    }
  }, [initial, navigate]);

  if (!initial?.session || !initial?.puzzle) return null;

  return <GameScreen session={initial.session} puzzle={initial.puzzle} />;
}

function GameScreen({ session: initialSession, puzzle }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(initialSession);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState({}); // { index: letter }
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { solved, score, correctAnswer }

  const totalSec = puzzle.timeLimitSeconds;
  const startedAtMs = useMemo(() => new Date(session.startedAt).getTime(), [session.startedAt]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [result]);

  const elapsedSec = Math.min(totalSec, Math.floor((now - startedAtMs) / 1000));
  const remaining = Math.max(0, totalSec - elapsedSec);

  async function submitGuess(e) {
    e.preventDefault();
    if (submitting || result) return;
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.post(`/sessions/${session.id}/guess`, { guess });
      setSession(data.session);
      if (data.solved) {
        setResult({ solved: true, score: data.score, correctAnswer: data.correctAnswer });
      } else {
        setError('Not quite — try again.');
        setGuess('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function requestHint() {
    setError(null);
    try {
      const data = await api.post(`/sessions/${session.id}/hint`, {});
      setRevealed(prev => ({ ...prev, [data.nextHint.index]: data.nextHint.letter }));
      setSession(prev => ({ ...prev, hintsUsed: data.hintsUsed }));
    } catch (err) {
      setError(err.message);
    }
  }

  function playAgain() {
    navigate('/game-start');
  }

  if (result) {
    return <ResultScreen result={result} puzzle={puzzle} session={session} onPlayAgain={playAgain} />;
  }

  const hintsMax = puzzle.revealSequence.length;
  const hintsLeft = hintsMax - session.hintsUsed;

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-text-muted2">Clue</div>
          <div className="text-xl text-navy">{puzzle.clue}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-text-muted2">Time</div>
          <div className={`text-2xl font-bold ${remaining < 10 ? 'text-red-600' : 'text-navy'}`}>
            {remaining}s
          </div>
        </div>
      </div>

      <div className="bg-white border-[10px] border-blue-700 rounded-xl p-6 text-center mb-6">
        <div className="text-5xl font-bold tracking-widest text-navy-dark" style={{ fontFamily: 'Alumni Sans, sans-serif' }}>
          {puzzle.plate}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs uppercase tracking-wide text-text-muted2 mb-2">Revealed letters</div>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(revealed).length === 0 && (
            <span className="text-sm text-text-muted2">None yet — use a hint below.</span>
          )}
          {Object.entries(revealed).map(([idx, letter]) => (
            <span key={idx} className="px-3 py-1 rounded bg-card-yellow text-navy font-mono">
              [{idx}] {letter}
            </span>
          ))}
        </div>
      </div>

      <form onSubmit={submitGuess} className="mb-4">
        <label className="block text-xs uppercase tracking-wide text-text-muted2 mb-2" htmlFor="guess">
          Type your answer
        </label>
        <input
          id="guess" type="text" value={guess} onChange={(e) => setGuess(e.target.value)}
          disabled={submitting || remaining === 0}
          className="w-full px-4 py-3 border-2 border-navy rounded-lg text-lg focus:outline-none focus:border-brand-orange"
          placeholder="e.g. love tomorrow"
          autoFocus
        />
        <div className="flex gap-3 mt-3">
          <button
            type="submit" disabled={submitting || !guess || remaining === 0}
            className="flex-1 py-3 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange disabled:opacity-60"
          >
            {submitting ? 'Checking…' : 'Submit'}
          </button>
          <button
            type="button" onClick={requestHint}
            disabled={hintsLeft === 0 || submitting}
            className="py-3 px-5 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream disabled:opacity-60"
          >
            Hint ({hintsLeft})
          </button>
        </div>
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="text-xs text-text-muted2">
        Wrong guesses: {session.wrongGuesses} · Hints used: {session.hintsUsed}
      </div>
    </div>
  );
}

function ResultScreen({ result, puzzle, session, onPlayAgain }) {
  return (
    <div className="min-h-screen px-4 py-16 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-serif text-navy mb-3">
        {result.solved ? 'Solved!' : 'Out of time'}
      </h1>
      {result.solved && (
        <div className="text-6xl font-bold text-brand-orange-dark mb-6">
          +{result.score}
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-card-gray2 mb-6">
        <div className="text-sm uppercase tracking-wide text-text-muted2">Plate</div>
        <div className="text-3xl font-bold tracking-widest text-navy-dark mb-3" style={{ fontFamily: 'Alumni Sans, sans-serif' }}>
          {puzzle.plate}
        </div>
        <div className="text-sm uppercase tracking-wide text-text-muted2">Answer</div>
        <div className="text-2xl text-navy mb-3">{result.correctAnswer}</div>
        <div className="text-xs text-text-muted2">
          Hints: {session.hintsUsed} · Wrong guesses: {session.wrongGuesses}
        </div>
      </div>
      <button
        onClick={onPlayAgain}
        className="py-3 px-8 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange"
      >
        Play again
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

From `/game-start`, click "Start random puzzle". You should land on `/game` with:
- The clue displayed at top
- The plate rendered in the blue-bordered frame
- A timer counting down
- Guess input + Submit button + Hint button with remaining count

Test happy path:
- Click "Hint" — a letter is revealed with its index
- Type the correct answer (check backend seed data for answer strings, e.g., "love tomorrow") and submit
- You see the result screen with your score, the correct answer, and a "Play again" button
- Click "Play again" — back to `/game-start`

Test wrong guess:
- Start a new session, submit "nope". You see "Not quite — try again" inline, wrongGuesses increments.

Test timer:
- Let the timer hit 0 while you watch. Input should disable.

Test hard-navigate protection:
- Paste `http://localhost:5173/game` into the URL bar (no state). You should be bounced to `/game-start`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/GamePlay.jsx
git commit -m "feat(frontend): GamePlay driven by live session with timer, hints, and score"
```

---

## Task 13: Landing header: show login/signup when logged out, sign-out when logged in

**Files:**
- Modify: `src/components/landing/LandingHeader.jsx`

- [ ] **Step 1: Read current file**

Find where `HEADER_CTA` (the "Start Playing" button) is rendered. You'll add auth-aware nav links next to it.

- [ ] **Step 2: Modify `src/components/landing/LandingHeader.jsx`**

At the top of the file, add:
```js
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
```

Inside the component, near the existing CTA render location, add:
```jsx
const { user, logout } = useAuth();
```

Render these auth controls alongside the existing "Start Playing" CTA (adjust JSX to fit existing layout — likely a flex row of nav links):

```jsx
{user ? (
  <div className="flex items-center gap-3">
    <Link to="/game-start" className="text-navy font-medium hover:underline">Play</Link>
    <span className="text-text-muted2 text-sm hidden md:inline">{user.email}</span>
    <button onClick={logout} className="text-brand-orange-dark underline text-sm">Sign out</button>
  </div>
) : (
  <div className="flex items-center gap-3">
    <Link to="/login" className="text-navy font-medium hover:underline">Log in</Link>
    <Link to="/signup" className="py-2 px-4 rounded-lg navy-gradient text-cream border-2 border-brand-orange font-semibold text-sm">
      Sign up
    </Link>
  </div>
)}
```

Place this where the existing "Start Playing" CTA lives — you can keep or remove the original CTA as preferred. If kept, the Play/Sign Up buttons sit alongside it.

- [ ] **Step 3: Manual verification**

Visit `http://localhost:5173/` when signed out: header shows "Log in" and "Sign up" links.
Sign up via `/signup`, then visit `/`: header shows "Play", your email, and "Sign out".
Click "Sign out" — header reverts to Log in/Sign up.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/LandingHeader.jsx
git commit -m "feat(frontend): auth-aware landing header"
```

---

## Task 14: End-to-end smoke + README update

**Files:**
- Modify: `server/README.md` (add a "Full-stack dev" section)

- [ ] **Step 1: End-to-end smoke — all in the browser**

Walk through this checklist, any failure indicates a bug:

1. Backend + MongoDB + frontend all running.
2. Visit `http://localhost:5173/` signed out. See Log in / Sign up in header.
3. Click Sign up. Create `alice@test.com` / `password123`. Auto-redirect to `/game-start`.
4. See 6 category cards. 3 locked (Premium).
5. Click "Start random puzzle". Land on `/game`. Clue + plate + timer visible.
6. Click "Hint" twice. Two letters revealed.
7. Submit a wrong guess (e.g. "zzz"). See inline error. wrongGuesses = 1.
8. Submit the correct answer (look up the answer for the current plate in `server/src/seed/seed-data.js`). See result screen with score > 0.
9. Click "Play again" → new `/game-start`.
10. Sign out from header. Redirect to landing.
11. Click "Log in", enter `alice@test.com` / wrong password. See "Invalid credentials".
12. Enter correct password. Logged in.
13. Click "Log in" again but this time use "Email me a sign-in link". Enter email. Click the dev link. Auto-redirected to `/game-start` signed in.
14. Paste `http://localhost:5173/game` directly with no state. Redirected to `/game-start`.
15. Sign out, paste `http://localhost:5173/game-start`. Redirected to `/login` with state.from set.
16. Log in. Auto-redirected to `/game-start`.

- [ ] **Step 2: Add "Full-stack dev" section to `server/README.md`**

At the top or end of the README, add:
```markdown
## Full-stack local dev

Start both sides:

```bash
# Terminal 1 — MongoDB (if using brew)
brew services start mongodb-community

# Terminal 2 — Backend
cd server && npm run dev       # http://localhost:4000

# Terminal 3 — Frontend
npm run dev                    # http://localhost:5173
```

Seed data once:
```bash
cd server && npm run seed
```

Env files:
- `server/.env` — backend secrets (see `.env.example`)
- `.env.local` — frontend (see `.env.local.example`)

In development, `/auth/magic/request` returns `devMagicLinkUrl` in its response for testing without SendGrid.
```

- [ ] **Step 3: Commit**

```bash
git add server/README.md
git commit -m "docs: full-stack dev instructions"
```

---

## Post-plan verification checklist

After all 14 tasks:

- [ ] Signup → auto-signin → land on `/game-start`
- [ ] Login with email/password works
- [ ] Magic link (via dev URL) works
- [ ] `/game-start` lists 6 categories with lock indicators
- [ ] Free "random puzzle" starts a session
- [ ] `/game` shows clue + plate + timer + guess input + hint button
- [ ] Correct guess → result screen with score
- [ ] Wrong guess → inline error, wrongGuesses increments
- [ ] Hint → letter appears in revealed section
- [ ] Play again flow works
- [ ] Sign out clears state and redirects
- [ ] Direct navigation to protected routes bounces to `/login`
- [ ] `location.state.from` restored after login

---

## Out of scope (later plans)

- Google OAuth button (JS lib integration) — currently only the backend endpoint works; UI button is noted but not wired. Add in a follow-up when a real `GOOGLE_CLIENT_ID` is provided.
- Premium upsell when a free user clicks a locked category (currently just disabled; future: open `PremiumAdModal`).
- Stripe checkout + admin pricing (Plan 4)
- Admin panel (Plan 5)
- Leaderboards, ads, deployment (Plan 6)
- Frontend test suite (Vitest + RTL) — deliberately deferred.
