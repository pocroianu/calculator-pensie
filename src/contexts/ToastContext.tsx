import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (
    type: ToastType,
    messageKey: string,
    options?: {
      messageParams?: Record<string, string | number>;
      duration?: number;
    }
  ) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 4000; // 4 seconds
const MAX_TOASTS = 5; // Maximum number of toasts to show at once

let toastIdCounter = 0;

const generateToastId = (): string => {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}-${Date.now()}`;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    // Clear the timeout if it exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (
      type: ToastType,
      messageKey: string,
      options?: {
        messageParams?: Record<string, string | number>;
        duration?: number;
      }
    ) => {
      const id = generateToastId();
      const duration = options?.duration ?? DEFAULT_DURATION;

      const newToast: Toast = {
        id,
        type,
        messageKey,
        messageParams: options?.messageParams,
        duration,
      };

      setToasts((prev) => {
        // Remove oldest toasts if we exceed the max
        const updatedToasts = [...prev, newToast];
        if (updatedToasts.length > MAX_TOASTS) {
          const toastsToRemove = updatedToasts.slice(0, updatedToasts.length - MAX_TOASTS);
          toastsToRemove.forEach((toast) => {
            const timeout = timeoutsRef.current.get(toast.id);
            if (timeout) {
              clearTimeout(timeout);
              timeoutsRef.current.delete(toast.id);
            }
          });
          return updatedToasts.slice(-MAX_TOASTS);
        }
        return updatedToasts;
      });

      // Set auto-dismiss timeout
      if (duration > 0) {
        const timeout = setTimeout(() => {
          removeToast(id);
        }, duration);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [removeToast]
  );

  const clearAllToasts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearAllToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
