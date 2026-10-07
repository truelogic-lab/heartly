import { api } from './client.js';

export const profileApi = {
  me: () => api.get('/profile/me'),
  update: (patch) => api.put('/profile/me', patch),
};
