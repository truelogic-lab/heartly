import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth.js';
import { setAccessToken, setRefreshHandler } from '../api/client.js';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------- session restore ---------- */
  const restore = useCallback(async () => {
    try {
      // Try refresh first — this re-issues an access token if the cookie is valid
      const refreshed = await authApi.refresh().catch(() => null);
      if (refreshed?.access) {
        setAccessToken(refreshed.access);
      }

      const me = await authApi.me().catch(() => null);
      if (me?.user) {
        setUser(me.user);
        setProfile(me.profile || null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  /* ---------- wire auto-refresh for expired tokens ---------- */
  useEffect(() => {
    setRefreshHandler(async () => {
      try {
        const r = await authApi.refresh();
        if (r?.access) {
          setAccessToken(r.access);
          return true;
        }
        return false;
      } catch {
        setUser(null);
        setProfile(null);
        return false;
      }
    });
  }, []);

  /* ---------- actions ---------- */

  const login = useCallback(async (creds) => {
    const r = await authApi.login(creds);
    setAccessToken(r.access);
    setUser(r.user);
    const me = await authApi.me().catch(() => null);
    setProfile(me?.profile || null);
    return r.user;
  }, []);

  const register = useCallback(async (payload) => {
    const r = await authApi.register(payload);
    setAccessToken(r.access);
    setUser(r.user);
    const me = await authApi.me().catch(() => null);
    setProfile(me?.profile || null);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setAccessToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const reloadMe = useCallback(async () => {
    const me = await authApi.me();
    setUser(me.user);
    setProfile(me.profile || null);
    return me;
  }, []);

  return (
    <SessionContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        reloadMe,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
