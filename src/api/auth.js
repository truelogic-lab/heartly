import { api } from './client.js';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload, { auth: false }),
  login: (payload) => api.post('/auth/login', payload, { auth: false }),
  refresh: () => api.post('/auth/refresh', {}, { auth: false }),
  logout: () => api.post('/auth/logout', {}),
  me: () => api.get('/auth/me'),
};
