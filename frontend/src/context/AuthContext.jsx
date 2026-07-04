/**
 * AuthContext
 * Holds the authenticated user + token lifecycle. On mount, if an access token
 * exists, it loads the profile. Exposes login/register/logout/updateProfile.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/auth.service.js';
import { tokenStore } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: restore session from a stored access token.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokenStore.access) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authService.getProfile();
        if (active) setUser(profile);
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: u, tokens } = await authService.login(credentials);
    tokenStore.set(tokens);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: u, tokens } = await authService.register(payload);
    tokenStore.set(tokens);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout(tokenStore.refresh);
    } catch {
      /* ignore network errors on logout */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const updated = await authService.updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const updateAvatar = useCallback(async (base64Data) => {
    const updated = await authService.uploadAvatar(base64Data);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role: user?.role || null,
      login,
      register,
      logout,
      updateProfile,
      updateAvatar,
      setUser
    }),
    [user, loading, login, register, logout, updateProfile, updateAvatar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
