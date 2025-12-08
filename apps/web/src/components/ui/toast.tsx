'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'], duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  };

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
          text: 'text-green-800 dark:text-green-200',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
          icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
          text: 'text-red-800 dark:text-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
          icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          text: 'text-amber-800 dark:text-amber-200',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
          icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          text: 'text-blue-800 dark:text-blue-200',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const styles = getToastStyles(t.type);
          return (
            <div
              key={t.id}
              className={`${styles.bg} border rounded-xl p-4 shadow-lg animate-in slide-in-from-right-full fade-in duration-300 pointer-events-auto`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">{styles.icon}</div>
                <p className={`flex-1 text-sm font-medium ${styles.text}`}>
                  {t.message}
                </p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

