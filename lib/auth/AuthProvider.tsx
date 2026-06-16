"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAuthProvider } from "./provider-factory";
import type { IAuthProvider, AuthUser } from "./types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  provider: IAuthProvider;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [provider] = useState<IAuthProvider>(() => getAuthProvider());

  const refreshUser = async () => {
    try {
      setLoading(true);
      const currentUser = await provider.getUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    const refreshUserSafe = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const currentUser = await provider.getUser();
        
        if (abortController.signal.aborted || !mounted) return;
        
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        if (abortController.signal.aborted || !mounted) return;
        
        console.error("Failed to refresh user:", error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    refreshUserSafe();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [provider]);

  return (
    <AuthContext.Provider value={{ user, loading, provider, refreshUser }}>
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
