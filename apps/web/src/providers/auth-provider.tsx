'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState } from '@/types';
import { useApplyUserLocale } from '@/providers/locale-provider';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { applyUserLocale } = useApplyUserLocale();

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
      const data = await res.json();
      
      if (data) {
        setUser(data);
        // Appliquer le thème de l'utilisateur connecté
        if (data.theme) {
          applyUserTheme(data.theme);
        }
        // Note: On n'applique PAS la locale ici pour éviter d'écraser
        // les changements de langue faits par l'utilisateur.
        // La locale est gérée par le cookie et le LocaleProvider.
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
        // Appliquer la locale de l'utilisateur après connexion
        if (data.user?.locale) {
          applyUserLocale(data.user.locale);
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
        
        // Rediriger vers la page de login
        window.location.href = '/login';
      }
      // Note: On ne réinitialise pas la locale à la déconnexion
      // car l'utilisateur peut vouloir rester dans sa langue
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      // Rediriger quand même en cas d'erreur
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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
