"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  theme: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodePayload(token: string): AuthUser & { exp: number } {
  let segment = token.split(".")[1];
  segment = segment.replace(/-/g, "+").replace(/_/g, "/");
  while (segment.length % 4 !== 0) segment += "=";
  const json = atob(segment);
  const p = JSON.parse(json);
  return {
    id: p.sub,
    name: p.name,
    email: p.email,
    role: p.role,
    theme: p.theme,
    exp: p.exp,
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      try {
        const decoded = decodePayload(stored);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
          setToken(stored);
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return { ok: false, error: "Invalid email or password" };

      const { token: jwt } = await res.json();
      localStorage.setItem("token", jwt);
      const decoded = decodePayload(jwt);
      setUser(decoded);
      setToken(jwt);
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }, []);

  const updateToken = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    const decoded = decodePayload(newToken);
    setUser(decoded);
    setToken(newToken);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
