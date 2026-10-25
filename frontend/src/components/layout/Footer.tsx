import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="w-4 h-4 text-green-600" aria-hidden="true" />
          <span>{t('shell.accessibility')}</span>
        </div>

        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:text-gov-navy underline-offset-2 hover:underline">
            {t('shell.privacy_policy', 'Privacy Policy (DPDP 2023)')}
          </a>
          <span>•</span>
          <a href="#terms" className="hover:text-gov-navy underline-offset-2 hover:underline">
            {t('shell.aicte_guidelines', 'AICTE Guidelines')}
          </a>
          <span>•</span>
          <span className="flex items-center gap-1">
            {t('shell.built_with', 'Built with')}{' '}
            <Heart className="w-3.5 h-3.5 text-gov-saffron fill-gov-saffron" aria-hidden="true" />{' '}
            {t('shell.for_digital_india', 'for Digital India')}
          </span>
        </div>

        <div>{t('shell.copyright')}</div>
      </div>
    </footer>
  );
};
