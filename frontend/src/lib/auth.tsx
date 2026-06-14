import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken, ApiError } from "./api";
import type { AuthUser, LoginResponse, Role } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const me = await api<AuthUser>("/api/auth/me");
      setUser(me);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setToken(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function login(email: string, password: string) {
    const res = await api<LoginResponse>("/api/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setUser(res.user);
  }

  async function register(data: { fullName: string; email: string; password: string; role: Role }) {
    const res = await api<LoginResponse>("/api/auth/register", {
      method: "POST", body: JSON.stringify(data),
    });
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function can(role: Role | undefined, ability:
  | "delete-ticket" | "assign-ticket" | "change-priority" | "change-status" | "manage-users"
): boolean {
  if (!role) return false;
  switch (ability) {
    case "delete-ticket":    return role === "Admin";
    case "manage-users":     return role === "Admin";
    case "assign-ticket":    return role === "Admin" || role === "TechLead";
    case "change-priority":  return role === "Admin" || role === "TechLead" || role === "ProductOwner";
    case "change-status":    return true;
  }
}
