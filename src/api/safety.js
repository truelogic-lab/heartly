import { api } from './client.js';

export const safetyApi = {
  listBlocked: () => api.get('/safety/blocked'),
  block: (userId) => api.post(`/safety/block/${userId}`, {}),
  unblock: (userId) => api.del(`/safety/block/${userId}`),
  getVisibility: () => api.get('/safety/visibility'),
  setVisibility: (visibility) => api.put('/safety/visibility', { visibility }),
  report: (userId, reason, alsoBlock = true) =>
    api.post(`/safety/report/${userId}`, { reason, alsoBlock }),
};
