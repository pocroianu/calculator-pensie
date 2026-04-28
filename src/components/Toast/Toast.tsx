import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType, ToastType as ToastVariant } from '../../contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// WCAG AA Compliant color combinations
// Text colors maintain minimum 4.5:1 contrast ratio on their backgrounds
const TOAST_STYLES: Record<ToastVariant, { container: string; icon: string }> = {
  success: {
    container: 'bg-a11y-success-bg-subtle border-a11y-success-border text-a11y-success-text',
    icon: 'text-a11y-success-icon',
  },
  error: {
    container: 'bg-a11y-error-bg-subtle border-a11y-error-border text-a11y-error-text',
    icon: 'text-a11y-error-icon',
  },
  warning: {
    container: 'bg-a11y-warning-bg-subtle border-a11y-warning-border text-a11y-warning-text',
    icon: 'text-a11y-warning-icon',
  },
  info: {
    container: 'bg-a11y-info-bg-subtle border-a11y-info-border text-a11y-info-text',
    icon: 'text-a11y-info-icon',
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { t } = useTranslation();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const Icon = TOAST_ICONS[toast.type];
  const styles = TOAST_STYLES[toast.type];

  // Animate in on mount
  useEffect(() => {
    // Small delay to trigger animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before removing
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  }, [onDismiss, toast.id]);

  // Handle keyboard dismiss
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDismiss();
      }
    },
    [handleDismiss]
  );

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
        transform transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${styles.container}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
      `}
      data-testid="toast"
      data-toast-type={toast.type}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${styles.icon}`} aria-hidden="true" />

      <span className="text-sm font-medium flex-1">
        {t(toast.messageKey, toast.messageParams)}
      </span>

      <button
        onClick={handleDismiss}
        className={`
          p-1 rounded-full transition-colors flex-shrink-0
          hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1
          ${toast.type === 'success' ? 'focus:ring-green-500' : ''}
          ${toast.type === 'error' ? 'focus:ring-red-500' : ''}
          ${toast.type === 'warning' ? 'focus:ring-amber-500' : ''}
          ${toast.type === 'info' ? 'focus:ring-blue-500' : ''}
        `}
        aria-label={t('common.close')}
        data-testid="toast-dismiss"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default Toast;
