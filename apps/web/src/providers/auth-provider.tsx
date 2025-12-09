'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Appliquer le thème de l'utilisateur
  const applyUserTheme = (theme: string) => {
    if (typeof window !== 'undefined' && theme) {
      localStorage.setItem('asuite-theme', theme);
      const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        // Appliquer le thème de l'utilisateur connecté
        if (data.theme) {
          applyUserTheme(data.theme);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        // Appliquer le thème de l'utilisateur après connexion
        if (data.user?.theme) {
          applyUserTheme(data.user.theme);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erreur de connexion' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      
      // Réinitialiser le thème à light (valeur par défaut)
      // Le thème est personnel et ne doit pas persister après déconnexion
      if (typeof window !== 'undefined') {
        localStorage.removeItem('asuite-theme');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const refresh = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

