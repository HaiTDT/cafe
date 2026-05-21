"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api, tokenStore, type User } from "../lib/api";

type AuthContextValue = {
  ready: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }) => Promise<void>;
  registerWithGoogle: (googleToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const decodeTokenUser = (token: string): User | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(window.atob(padded));

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = tokenStore.get();

    if (storedToken) {
      setUser(decodeTokenUser(storedToken));
    }

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);

    setReady(true);

    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const persistSession = useCallback((token: string, nextUser: User) => {
    tokenStore.set(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.login({ email, password });
      persistSession(result.token, result.user);
    },
    [persistSession]
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName?: string;
      phone?: string;
    }) => {
      const result = await api.register(input);
      persistSession(result.token, result.user);
    },
    [persistSession]
  );

  const registerWithGoogle = useCallback(
    async (googleToken: string) => {
      const result = await api.registerWithGoogle({ googleToken });
      persistSession(result.token, result.user);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const latestUser = await api.getProfile();
      setUser(latestUser);
    } catch (error: any) {
      if (error?.status !== 401) {
        console.error("Failed to refresh user", error);
      }
    }
  }, []);

  const value = useMemo(
    () => ({ ready, user, login, register, registerWithGoogle, logout, refreshUser }),
    [ready, user, login, register, registerWithGoogle, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
