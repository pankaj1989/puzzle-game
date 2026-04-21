# Ads + Google Sign-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google AdSense support on the free tier (loaded only when an AdSense ID is configured) and wire a Google Sign-In button into the existing `/auth/google` backend endpoint.

**Architecture:** Frontend-only changes. A tiny `<AdSlot>` component renders an AdSense `<ins>` tag when (a) `VITE_ADSENSE_CLIENT_ID` is set, (b) the current user is on the free plan, and (c) the AdSense script has loaded. An `index.html` tweak conditionally includes the AdSense script tag via Vite env var injection at build time. For sign-in, install `@react-oauth/google`, wrap the app in `GoogleOAuthProvider` only when `VITE_GOOGLE_CLIENT_ID` is set, and drop a `GoogleLogin` button on the login and signup pages that posts the returned ID token to the existing `POST /auth/google` endpoint via `useAuth().loginWithGoogle`.

**Tech Stack:**
- New frontend dep: `@react-oauth/google` (~50kb)
- No backend changes — `/auth/google` already accepts `{ idToken }` and issues session tokens (Plan 1).

---

## File Structure

```
/                                          (repo root — frontend)
├── .env.local.example                     # MODIFY: add VITE_ADSENSE_CLIENT_ID (VITE_GOOGLE_CLIENT_ID already documented)
├── index.html                             # MODIFY: conditional AdSense script (via Vite %VITE_x% subst)
└── src/
    ├── ads/
    │   └── AdSlot.jsx                     # NEW: gated AdSense slot component
    ├── auth/
    │   ├── GoogleProvider.jsx             # NEW: optional wrapper around @react-oauth/google's GoogleOAuthProvider
    │   └── GoogleSignInButton.jsx         # NEW: button that calls useAuth().loginWithGoogle
    ├── App.jsx                            # MODIFY: wrap in GoogleProvider
    ├── pages/
    │   ├── LoginPage.jsx                  # MODIFY: render GoogleSignInButton when enabled
    │   ├── SignupPage.jsx                 # MODIFY: render GoogleSignInButton when enabled
    │   ├── GameStart.jsx                  # MODIFY: render <AdSlot /> at bottom for free users
    │   └── GamePlay.jsx                   # MODIFY: render <AdSlot /> on ResultScreen for free users
    └── package.json                       # MODIFY: @react-oauth/google dep (via npm install)
```

---

## Notes on Google AdSense

- **Publisher approval is required.** AdSense won't serve ads until Google approves the site. Keep `VITE_ADSENSE_CLIENT_ID` empty until you're approved; the component no-ops when unset.
- The AdSense script tag adds ~100KB of JS; we only load it when the env var is set (build-time).
- `data-ad-client` and `data-ad-slot` are the only required attributes on the `<ins>` element.

---

## Notes on Google Sign-In

- The backend endpoint `POST /auth/google` already exists (Plan 1). It accepts `{ idToken }` and issues session tokens.
- The same `VITE_GOOGLE_CLIENT_ID` you set in `server/.env` (`GOOGLE_CLIENT_ID`) must be used on the frontend — the ID token's audience must match.
- We hide the button entirely when `VITE_GOOGLE_CLIENT_ID` is unset.

---

## Conventions

- No new tests (frontend-only, no test infra). Each task ends with manual verification.
- 1 commit per task.

---

## Task 1: Install `@react-oauth/google`

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm install)
- Modify: `.env.local.example` (document VITE_ADSENSE_CLIENT_ID)

- [ ] **Step 1: Install**

From repo root:
```bash
npm install @react-oauth/google
```

- [ ] **Step 2: Update `.env.local.example`**

Append:
```
# Google AdSense publisher ID (pub-...). Leave empty until approved.
# When empty, no ad script loads and no ad slots render.
VITE_ADSENSE_CLIENT_ID=
```

- [ ] **Step 3: Verify frontend dev server still loads**

Open `http://localhost:5173/` in the browser. Expected: landing page renders normally. `@react-oauth/google` is a peer-only install at this point and doesn't change runtime behavior.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.local.example
git commit -m "chore(frontend): install @react-oauth/google, document ADSENSE env"
```

---

## Task 2: GoogleProvider wrapper + App wiring

**Files:**
- Create: `src/auth/GoogleProvider.jsx`
- Modify: `src/App.jsx`

The `GoogleProvider` renders `<GoogleOAuthProvider clientId={...}>` when a client id is configured, and otherwise is a passthrough. This keeps the app free of the provider when Google sign-in isn't set up.

- [ ] **Step 1: Create `src/auth/GoogleProvider.jsx`**

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleProvider({ children }) {
  if (!CLIENT_ID) return children;
  return <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
```

- [ ] **Step 2: Modify `src/App.jsx`**

Add import:
```jsx
import GoogleProvider from './auth/GoogleProvider';
```

Wrap the existing `<AuthProvider>` tree:
```jsx
export default function App() {
  return (
    <GoogleProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* existing routes unchanged */}
        </BrowserRouter>
      </AuthProvider>
    </GoogleProvider>
  );
}
```

- [ ] **Step 3: Manual verification**

With `VITE_GOOGLE_CLIENT_ID` unset (empty in `.env.local`): app loads exactly as before.

With it set to a fake value like `test.apps.googleusercontent.com`: app still loads. `window.google` may not exist but no errors appear.

- [ ] **Step 4: Commit**

```bash
git add src/auth/GoogleProvider.jsx src/App.jsx
git commit -m "feat(frontend): optional GoogleOAuthProvider wrapper"
```

---

## Task 3: GoogleSignInButton + place on LoginPage + SignupPage

**Files:**
- Create: `src/auth/GoogleSignInButton.jsx`
- Modify: `src/pages/LoginPage.jsx`
- Modify: `src/pages/SignupPage.jsx`

The button uses `@react-oauth/google`'s `GoogleLogin` component. On success it receives a credential (ID token) which we send to our `/auth/google` endpoint via the existing `useAuth().loginWithGoogle` function.

- [ ] **Step 1: Create `src/auth/GoogleSignInButton.jsx`**

```jsx
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
```

- [ ] **Step 2: Modify `src/pages/LoginPage.jsx`**

Open the file. Find the section with the `"Email me a sign-in link"` button. The existing code has a placeholder paragraph about `VITE_GOOGLE_CLIENT_ID` — we'll replace that with a real button.

Add import at the top:
```jsx
import GoogleSignInButton from '../auth/GoogleSignInButton';
```

Replace this existing block (which shows a "not yet implemented" message when enabled and a "set env var" message when disabled):
```jsx
        {!googleClientId && (
          <p className="text-xs text-text-muted2 mt-4 text-center">
            Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> to enable Google Sign-In.
          </p>
        )}
```

With:
```jsx
        {googleClientId ? (
          <div className="mt-4 flex justify-center">
            <GoogleSignInButton onError={setError} redirectTo={redirectTo} />
          </div>
        ) : (
          <p className="text-xs text-text-muted2 mt-4 text-center">
            Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> to enable Google Sign-In.
          </p>
        )}
```

- [ ] **Step 3: Modify `src/pages/SignupPage.jsx`**

Signup currently has no Google affordance. Add one right above the "Already have an account? Log in" footer.

Add import:
```jsx
import GoogleSignInButton from '../auth/GoogleSignInButton';
```

Add a `googleClientId` constant at the top of the component:
```jsx
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

Then, just BEFORE the final `<p className="text-sm text-text-muted mt-6 text-center">Already have an account?...</p>` paragraph, insert:
```jsx
{googleClientId && (
  <>
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-card-gray2" />
      <span className="text-xs text-text-muted2">OR</span>
      <div className="flex-1 h-px bg-card-gray2" />
    </div>
    <div className="flex justify-center">
      <GoogleSignInButton onError={setError} />
    </div>
  </>
)}
```

- [ ] **Step 4: Manual verification**

With `VITE_GOOGLE_CLIENT_ID` set to a real Google OAuth Web Client ID (matching the backend's `GOOGLE_CLIENT_ID`):
1. Visit `/login` — Google button renders below the magic-link section.
2. Click it → Google popup → pick account → redirected to `/game-start` signed in.
3. Visit `/signup` — Google button below the signup form.

With it unset: no button anywhere (pages look exactly like before).

If backend `GOOGLE_CLIENT_ID` is still the placeholder, the `/auth/google` POST will fail with "Invalid Google token". Swap in a real client id to actually test end-to-end.

- [ ] **Step 5: Commit**

```bash
git add src/auth/GoogleSignInButton.jsx src/pages/LoginPage.jsx src/pages/SignupPage.jsx
git commit -m "feat(frontend): Google Sign-In button on login + signup"
```

---

## Task 4: AdSlot component + conditional AdSense script

**Files:**
- Modify: `index.html` (conditional script tag via Vite env replacement)
- Create: `src/ads/AdSlot.jsx`

- [ ] **Step 1: Modify `index.html`**

Read the current file. Add a script tag inside `<head>` that is only injected when the env var is set. Vite substitutes `%VITE_ADSENSE_CLIENT_ID%` at build time from `.env.local`.

Find the existing `<head>` section. Add this right before `</head>`:
```html
    <!-- Google AdSense — only functional when VITE_ADSENSE_CLIENT_ID is set -->
    <script async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%VITE_ADSENSE_CLIENT_ID%"
      crossorigin="anonymous"></script>
```

When the env var is empty, Vite still substitutes — the src becomes `...?client=` which is a harmless no-op URL (Google simply doesn't serve ads). The `<AdSlot>` component checks the env var itself before rendering, so no ad `<ins>` tags appear.

This approach is simpler than conditional injection and fine in practice.

- [ ] **Step 2: Create `src/ads/AdSlot.jsx`**

```jsx
import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';

const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID;

export default function AdSlot({ slot, format = 'auto', className = '' }) {
  const { user } = useAuth();
  const ref = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (user?.plan === 'premium') return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script hasn't loaded yet or user is offline — silent fail
    }
  }, [user, slot]);

  if (!CLIENT_ID) return null;
  if (user?.plan === 'premium') return null;

  return (
    <div ref={ref} className={`my-6 text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

With `VITE_ADSENSE_CLIENT_ID` unset: no `<ins>` elements in the DOM (AdSlot renders null). No script errors.

With it set to a fake value like `ca-pub-0000000000000000`: `<ins>` element appears in the DOM. AdSense won't actually serve an ad (site isn't approved), but the HTML structure is correct.

Once you're AdSense-approved and using a real publisher ID: ads will appear on AdSlot placements for free users only.

- [ ] **Step 4: Commit**

```bash
git add index.html src/ads/AdSlot.jsx
git commit -m "feat(frontend): AdSense script + AdSlot component (free users only)"
```

---

## Task 5: Place AdSlot on GameStart + ResultScreen

**Files:**
- Modify: `src/pages/GameStart.jsx`
- Modify: `src/pages/GamePlay.jsx`

- [ ] **Step 1: GameStart — ad at the bottom**

Add import at top:
```jsx
import AdSlot from '../ads/AdSlot';
```

Find the closing `</div>` of the outer container (the `<div className="min-h-screen px-4 py-10 max-w-4xl mx-auto">`). Right BEFORE the `<PremiumAdModal ... />` element near the end, add:
```jsx
<AdSlot slot="1234567890" />
```

Use `"1234567890"` as a placeholder slot id. Real slot IDs come from your AdSense dashboard — create a "display" ad unit for each placement you want.

- [ ] **Step 2: GamePlay — ad on ResultScreen**

Find the `ResultScreen` component. Add import at top of the file (if not already there):
```jsx
import AdSlot from '../ads/AdSlot';
```

Inside `ResultScreen`, BEFORE the final `<button onClick={onPlayAgain}...>Play again</button>`, add:
```jsx
<AdSlot slot="9876543210" className="mb-6" />
```

- [ ] **Step 3: Manual verification**

Same as Task 4 — with env unset, no ad slots render. With a fake publisher ID, `<ins>` elements appear in the DOM on `/game-start` and after solving a puzzle. Sign in as a premium user → ads are hidden.

- [ ] **Step 4: Commit**

```bash
git add src/pages/GameStart.jsx src/pages/GamePlay.jsx
git commit -m "feat(frontend): render AdSlot on GameStart + ResultScreen for free users"
```

---

## Task 6: README updates

**Files:**
- Modify: `server/README.md`

- [ ] **Step 1: Append an "Ads + Google Sign-In" section**

After the "Leaderboards + Streaks" section:
```markdown
## Ads

Google AdSense is rendered to **free users only**. Premium users see no ad slots.

1. Get approved at https://www.google.com/adsense/
2. Put your publisher id in `.env.local` (frontend):
   ```
   VITE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
   ```
3. Create ad units in the AdSense dashboard and replace the placeholder slot IDs (`1234567890`, `9876543210`) in `src/pages/GameStart.jsx` and `src/pages/GamePlay.jsx` with your real slot IDs.
4. Redeploy. Wait for Google to start serving ads (can take several hours after approval).

## Google Sign-In

Backend endpoint `POST /auth/google` already accepts `{ idToken }` (Plan 1). Frontend now renders a **Sign in with Google** button on both `/login` and `/signup`.

1. Create an OAuth Web Client at https://console.cloud.google.com/apis/credentials
2. Put the client id in BOTH:
   - `server/.env`: `GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com`
   - `.env.local` (frontend): `VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com`
3. Add `http://localhost:5173` to the Authorized JavaScript origins in the Cloud Console.
4. Restart both dev servers.

When the button is clicked, Google returns an ID token. The frontend POSTs it to `/auth/google`; the server verifies it via `google-auth-library` and issues session tokens.
```

- [ ] **Step 2: Commit**

```bash
git add server/README.md
git commit -m "docs: AdSense + Google Sign-In setup instructions"
```

---

## Post-plan verification checklist

- [ ] `.env.local.example` has `VITE_ADSENSE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`
- [ ] With both env vars unset: app behaves exactly as before Plan 7 — no ads, no Google button
- [ ] With `VITE_ADSENSE_CLIENT_ID` set (fake is fine): `<ins>` elements appear on `/game-start` and ResultScreen for free users; hidden for premium
- [ ] With `VITE_GOOGLE_CLIENT_ID` set to a real client id (matching backend): button appears on `/login` + `/signup`, clicking completes sign-in and redirects
- [ ] No backend tests regressed (`cd server && npm test` → still 182 passing)

---

## Out of scope

- Automated frontend tests (still deferred — whole frontend is manual verification)
- Interstitial or rewarded ads (only display ads in this plan)
- Google One Tap auto-prompt (disabled via `useOneTap={false}` — can be enabled later)
- GDPR / consent banner for ads (required in EU markets; out of scope for v1 but must be added before launching in EU)
- VPS deployment (Plan 8)
