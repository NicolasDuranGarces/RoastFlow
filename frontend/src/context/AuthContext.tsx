import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { fetchCurrentUser, loginRequest, setAuthToken } from "../services/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_STORAGE_KEY = "caturro_token";
const LEGACY_TOKEN_STORAGE_KEY = "tueste_token";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      return stored;
    }
    const legacy = localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
    if (legacy) {
      localStorage.setItem(TOKEN_STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
      return legacy;
    }
    return null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setAuthToken(token);
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await fetchCurrentUser();
        setUser(data as User);
      } catch (error) {
        console.error("Failed to load current user", error);
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await loginRequest(email, password);
      const accessToken = data.access_token as string;
      setToken(accessToken);
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      setAuthToken(accessToken);
      const profile = await fetchCurrentUser();
      setUser(profile.data as User);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      logout
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
