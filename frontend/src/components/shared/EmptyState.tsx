import React from 'react';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-dashed border-slate-300 ${className}`}
      role="region"
      aria-label="Empty records state"
    >
      <div className="p-3 bg-slate-50 text-slate-400 rounded-full mb-3">
        {icon || <Inbox className="w-8 h-8" aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title || t('common.no_data')}</h3>
      {description && <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
