'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  icon?: ReactNode;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      resolveRef?.(true);
      setIsOpen(false);
      setIsLoading(false);
    }, 100);
  };

  const handleCancel = () => {
    resolveRef?.(false);
    setIsOpen(false);
  };

  const getVariantStyles = () => {
    switch (options?.variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          icon: options.icon || <Trash2 className="w-6 h-6" />,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          buttonBg: 'bg-amber-600 hover:bg-amber-700',
          icon: options.icon || <AlertTriangle className="w-6 h-6" />,
        };
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          icon: options?.icon || <AlertTriangle className="w-6 h-6" />,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="relative bg-card rounded-2xl border shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center mx-auto mb-4`}>
                {styles.icon}
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center mb-2">
                {options?.title}
              </h2>

              {/* Message */}
              <p className="text-muted-foreground text-center mb-6">
                {options?.message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 h-11 rounded-xl border border-input bg-background hover:bg-accent font-medium transition-colors disabled:opacity-50"
                >
                  {options?.cancelText || 'Annuler'}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 h-11 rounded-xl text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles.buttonBg}`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    options?.confirmText || 'Confirmer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

