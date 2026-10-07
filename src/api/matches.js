import { api } from './client.js';

export const matchApi = {
  like: (userId) => api.post(`/like/${userId}`, {}),
  superLike: (userId) => api.post(`/super-like/${userId}`, {}),
  pass: (userId) => api.post(`/pass/${userId}`, {}),
  likesReceived: () => api.get('/likes/received'),
  likesSent: () => api.get('/likes/sent'),
  list: () => api.get('/matches'),
  detail: (matchId) => api.get(`/matches/${matchId}`),
};

export const chatApi = {
  conversation: (matchId) => api.get(`/chat/${matchId}`),
  send: (matchId, body) => api.post(`/chat/${matchId}`, { body }),
  markRead: (matchId) => api.post(`/chat/${matchId}/read`, {}),
};

export const safetyApi = {
  block: (userId) => api.post(`/safety/block/${userId}`, {}),
  unblock: (userId) => api.post(`/safety/unblock/${userId}`, {}),
  report: (userId, reason) => api.post(`/safety/report/${userId}`, { reason }),
};
