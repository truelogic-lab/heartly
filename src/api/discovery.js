import { api } from './client.js';

export const discoveryApi = {
  feed: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/discover${q ? `?${q}` : ''}`);
  },
  dailyPicks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/daily-picks${q ? `?${q}` : ''}`);
  },
  onlineNow: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/online-now${q ? `?${q}` : ''}`);
  },
  byInterest: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/by-interest${q ? `?${q}` : ''}`);
  },
};
