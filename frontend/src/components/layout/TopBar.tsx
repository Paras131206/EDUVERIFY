import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Shield, User as UserIcon } from 'lucide-react';
import { mockUser } from '@/mocks/data';

export const TopBar: React.FC = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="bg-gov-navy text-white shadow-md border-b-4 border-gov-saffron">
      <div className="bg-gov-navyDark text-slate-300 text-[11px] px-4 py-1 flex justify-between items-center border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-wide">{t('app.gov_portal')}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 transition focus:outline-none focus:ring-1 focus:ring-gov-saffron text-xs"
            aria-label={`Switch language to ${i18n.language === 'en' ? 'हिन्दी' : 'English'}`}
          >
            <Languages className="w-3.5 h-3.5 text-gov-saffron" aria-hidden="true" />
            <span>{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>

      <div className="px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <Shield className="w-6 h-6 text-gov-saffron" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{t('app.title')}</span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-gov-saffron text-gov-navyDark">
                APAAR Core
              </span>
            </h1>
            <p className="text-xs text-slate-300 font-normal">{t('app.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{mockUser.full_name}</p>
            <p className="text-[11px] text-gov-saffron font-medium">
              {t(`roles.${mockUser.role}`, { defaultValue: mockUser.role })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
            <UserIcon className="w-5 h-5 text-slate-200" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
};
