import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastVariant } from './Toast';

export interface ToastInput {
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
  icon?: ReactNode;
}

interface ToastRecord extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toasts: ToastRecord[];
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = createToastId();
    setToasts((previous) => [...previous, { ...toast, id }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      dismissToast,
      clearToasts,
    }),
    [clearToasts, dismissToast, showToast, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="muwi-toast-viewport" role="region" aria-label="Notifications">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              title={toast.title}
              variant={toast.variant}
              duration={toast.duration}
              icon={toast.icon}
              onClose={dismissToast}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
