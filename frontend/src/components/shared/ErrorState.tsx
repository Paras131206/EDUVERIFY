import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-lg border border-red-200 ${className}`}
      role="alert"
    >
      <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
        <AlertCircle className="w-8 h-8" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-red-900">{title || t('common.error')}</h3>
      <p className="text-xs text-red-700 max-w-sm mt-1 mb-4">
        {message || 'An unexpected error occurred while loading this section.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-red-400"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('common.retry')}</span>
        </button>
      )}
    </div>
  );
};
