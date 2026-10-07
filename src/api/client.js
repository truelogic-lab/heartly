/**
 * API client for the Heartly backend.
 *
 * Every authenticated request automatically includes the access token.
 * If the token is expired and the refresh token is valid, we silently
 * refresh and retry the original request once.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://heartly-j07m.onrender.com/api/v1/heartly';

let accessToken = null;
let refreshHandler = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

/** Called by SessionContext to wire the automatic refresh. */
export function setRefreshHandler(fn) {
  refreshHandler = fn;
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.code = body?.code;
  }
}

async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — try to refresh once
  if (res.status === 401 && auth && retry && refreshHandler) {
    const refreshed = await refreshHandler();
    if (refreshed) {
      return request(path, { method, body, auth, retry: false });
    }
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
