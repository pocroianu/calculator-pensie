import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  title?: string;
  description?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Error logging utility
export const logError = (error: Error, errorInfo?: ErrorInfo, componentStack?: string) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack || componentStack,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console in development
  console.error('ErrorBoundary caught an error:', errorLog);

  // In production, you would send this to an error tracking service
  // Example: sendToErrorTracking(errorLog);

  // Store in sessionStorage for debugging (limited to last 5 errors)
  try {
    const storedErrors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
    storedErrors.push(errorLog);
    if (storedErrors.length > 5) {
      storedErrors.shift();
    }
    sessionStorage.setItem('app_errors', JSON.stringify(storedErrors));
  } catch {
    // Ignore sessionStorage errors
  }
};

// Error Fallback UI Component (functional to use hooks)
interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  onReload: () => void;
  title?: string;
  description?: string;
}

const ErrorFallbackUI: React.FC<ErrorFallbackProps> = ({
  error,
  onReset,
  onReload,
  title,
  description,
}) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[200px] flex items-center justify-center p-6" data-testid="error-boundary">
      <div className="bg-white rounded-lg shadow-lg border border-red-100 p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title || t('error.title')}
          </h2>
        </div>

        <p className="text-gray-600 mb-4">
          {description || t('error.description')}
        </p>

        {/* Show error details in development */}
        {import.meta.env.DEV && error && (
          <details className="mb-4 p-3 bg-gray-50 rounded-md">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              {t('error.details')}
            </summary>
            <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
              {error.message}
              {error.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            data-testid="error-boundary-retry"
          >
            <RefreshCw className="w-4 h-4" />
            {t('error.tryAgain')}
          </button>
          <button
            onClick={onReload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            data-testid="error-boundary-reload"
          >
            <Home className="w-4 h-4" />
            {t('error.reloadPage')}
          </button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    logError(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use the functional fallback component for translation support
      return (
        <ErrorFallbackUI
          error={this.state.error}
          onReset={this.handleReset}
          onReload={this.handleReload}
          title={this.props.title}
          description={this.props.description}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
