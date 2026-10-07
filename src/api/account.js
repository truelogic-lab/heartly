import { api } from './client.js';

export const accountApi = {
  deleteAccount: (password, confirm) =>
    api.del('/auth/account', { body: { password, confirm } }),
};
