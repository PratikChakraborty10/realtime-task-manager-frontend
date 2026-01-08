"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { getAccessToken, removeAccessToken } from "@/lib/cookies";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface User {
  id: string;
  name: string;
  email: string;
  gender: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // If token exists, fetch user profile
      fetch("/api/auth/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            // Connect socket when user is authenticated
            connectSocket(token);
          }
        })
        .catch(() => {
          // Token invalid, clear it
          removeAccessToken();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
    // Connect socket on login
    const token = getAccessToken();
    if (token) {
      connectSocket(token);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    removeAccessToken();
    // Disconnect socket on logout
    disconnectSocket();
  }, []);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
