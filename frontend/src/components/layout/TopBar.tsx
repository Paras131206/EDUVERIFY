import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isHindi = i18n.language?.startsWith('hi');

  const setLang = (nextLang: 'en' | 'hi') => {
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-gov-navy text-white shadow-md border-b-4 border-gov-saffron">
      <div className="bg-gov-navyDark text-slate-300 text-[11px] px-4 py-1 flex justify-between items-center border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-wide">{t('app.gov_portal')}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center rounded bg-slate-800/90 p-0.5 border border-slate-700/80 text-xs">
            <Languages className="w-3.5 h-3.5 text-gov-saffron ml-1.5 mr-1" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition focus:outline-none focus:ring-1 focus:ring-gov-saffron ${
                !isHindi
                  ? 'bg-gov-saffron text-gov-navyDark font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              aria-pressed={!isHindi}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition focus:outline-none focus:ring-1 focus:ring-gov-saffron ${
                isHindi
                  ? 'bg-gov-saffron text-gov-navyDark font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              aria-pressed={isHindi}
            >
              हिन्दी
            </button>
          </div>
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

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{user.full_name}</p>
                <p className="text-[11px] text-gov-saffron font-medium">
                  {t(`roles.${user.role}`, { defaultValue: user.role })}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <UserIcon className="w-5 h-5 text-slate-200" aria-hidden="true" />
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1 bg-gov-saffron text-gov-navyDark text-xs font-bold rounded shadow-xs hover:bg-gov-saffronDark transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
