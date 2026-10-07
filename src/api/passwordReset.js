import { api } from './client.js';

export const passwordResetApi = {
  forgot: (email) =>
    api.post('/auth/forgot-password', { email }, { auth: false }),

  reset: (token, password) =>
    api.post('/auth/reset-password', { token, password }, { auth: false }),
};
