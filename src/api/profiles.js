import { api } from './client.js';

export const profileApi = {
  me: () => api.get('/profile/me'),
  update: async (patch) => {
    await api.put('/profile/me', patch);
    const fresh = await api.get('/profile/me');
    return fresh?.profile ?? fresh;
  },
};
