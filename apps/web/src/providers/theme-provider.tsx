'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme, saveToServer?: boolean) => void;
  resolvedTheme: 'light' | 'dark';
  loadUserTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Update resolved theme
  const updateResolvedTheme = useCallback((newTheme: Theme) => {
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    
    // Update DOM
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
    }
  }, []);

  // Set theme and persist (optionally to server)
  const setTheme = useCallback(async (newTheme: Theme, saveToServer = true) => {
    setThemeState(newTheme);
    localStorage.setItem('asuite-theme', newTheme);
    updateResolvedTheme(newTheme);
    
    // Sauvegarder sur le serveur si demandé
    if (saveToServer) {
      try {
        await fetch('/api/auth/theme', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (error) {
        // Silently fail - le localStorage est le fallback
      }
    }
  }, [updateResolvedTheme]);

  // Charger le thème de l'utilisateur depuis le serveur
  const loadUserTheme = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/theme');
      if (res.ok) {
        const data = await res.json();
        if (data.theme) {
          setThemeState(data.theme as Theme);
          localStorage.setItem('asuite-theme', data.theme);
          updateResolvedTheme(data.theme as Theme);
        }
      }
    } catch (error) {
      // Utiliser le localStorage comme fallback
    }
  }, [updateResolvedTheme]);

  // Initialize on mount
  useEffect(() => {
    const stored = localStorage.getItem('asuite-theme') as Theme | null;
    // Par défaut: light pour les visiteurs non connectés
    const initialTheme = stored || 'light';
    setThemeState(initialTheme);
    updateResolvedTheme(initialTheme);
    setMounted(true);
  }, [updateResolvedTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted, updateResolvedTheme]);

  // Prevent flash
  if (!mounted) {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const stored = localStorage.getItem('asuite-theme');
              const theme = stored || 'light';
              const resolved = theme === 'system' 
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme;
              document.documentElement.classList.add(resolved);
            })();
          `,
        }}
      />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, loadUserTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

