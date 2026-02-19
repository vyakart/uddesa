import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import { ToastContext, type ToastContextValue, type ToastInput, type ToastRecord } from './ToastContext';

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
