const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://heartly-j07m.onrender.com/api/v1/heartly';

export async function uploadAvatar(file, token) {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${API_BASE}/upload/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: fd,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }

  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);
  return data;
}
