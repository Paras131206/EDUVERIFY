import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { t } = useTranslation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2 shadow-md sticky top-0 z-50"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4" aria-hidden="true" />
      <span>{t('shell.offline_warning')}</span>
    </div>
  );
};
