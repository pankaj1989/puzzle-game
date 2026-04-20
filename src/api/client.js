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
      res = await doFetch(path, opts);
    } catch {
      // fall through to parseOrThrow on the (retried or original) response
    }
  }
  return parseOrThrow(res);
}

export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body }),
};
