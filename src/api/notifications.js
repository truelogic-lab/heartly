import { api } from './client.js';

export const notificationsApi = {
  list: () => api.get('/notifications'),
  count: () => api.get('/notifications/count'),
};
