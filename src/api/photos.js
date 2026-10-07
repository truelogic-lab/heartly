const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://heartly-j07m.onrender.com/api/v1/heartly';

async function authedFetch(path, options = {}) {
  const { getAccessToken } = await import('./client.js');
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }

  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const photoApi = {
  async upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    return authedFetch('/profile/photos', {
      method: 'POST',
      body: fd,
    });
  },

  async remove(id) {
    return authedFetch(`/profile/photos/${id}`, { method: 'DELETE' });
  },

  async setPrimary(id) {
    return authedFetch(`/profile/photos/${id}/primary`, { method: 'PUT' });
  },

  async reorder(ids) {
    return authedFetch('/profile/photos/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  },
};
