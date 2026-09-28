import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, country: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    phone: string;
    country: string;
    password: string;
    transactionPassword: string;
    invitationCode?: string;
    captchaCode: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") refreshUser();
    };

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [refreshUser]);

  const login = async (phone: string, country: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { phone, country, password });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Erreur de connexion");
    }
    setUser(data.user);
  };

  const register = async (data: {
    fullName: string;
    phone: string;
    country: string;
    password: string;
    transactionPassword: string;
    invitationCode?: string;
    captchaCode: string;
  }) => {
    const response = await apiRequest("POST", "/api/auth/register", data);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Erreur d'inscription");
    }
    setUser(result.user);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
