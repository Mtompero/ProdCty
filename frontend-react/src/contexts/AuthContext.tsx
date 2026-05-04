import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types";
import * as api from "../lib/api";

type AuthContextValue = {
  token: string;
  user: User | null;
  loading: boolean;
  loginUser: (payload: { email: string; password: string }) => Promise<{ ok: boolean; message: string }>;
  registerUser: (payload: {
    username: string;
    email: string;
    password: string;
    interests: string[];
  }) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "prodcty_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const result = await api.fetchMe(token);
    if (!result.ok || !result.data) {
      if (result.status === 401 || result.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
      }
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(result.data.user);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const loginUser = useCallback(async (payload: { email: string; password: string }) => {
    const result = await api.login(payload);
    if (!result.ok || !result.data) {
      return { ok: false, message: result.errorMessage };
    }
    localStorage.setItem(TOKEN_KEY, result.data.token);
    setToken(result.data.token);
    setUser(result.data.user);
    return { ok: true, message: "" };
  }, []);

  const registerUser = useCallback(
    async (payload: {
      username: string;
      email: string;
      password: string;
      interests: string[];
    }) => {
      const result = await api.register(payload);
      if (!result.ok) {
        return { ok: false, message: result.errorMessage };
      }
      return { ok: true, message: "Account created. You can log in now." };
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      loginUser,
      registerUser,
      logout,
      refreshMe,
      setUser,
    }),
    [loading, loginUser, logout, refreshMe, registerUser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
