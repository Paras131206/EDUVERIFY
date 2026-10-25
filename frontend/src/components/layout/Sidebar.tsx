import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  LayoutDashboard,
  UploadCloud,
  Layers,
  CheckSquare,
  ArrowLeftRight,
  ShieldCheck,
  Wallet,
  FileBarChart2,
  Settings,
  Scale,
  LogOut,
  LogIn,
  Users,
  BarChart3,
  Briefcase,
  Sun,
  Moon,
  History,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const role = user?.role;

  // Filter items based on user role
  const navItems = [
    // Institution items
    {
      to: '/institution',
      label: t('nav.institution'),
      icon: <Building2 className="w-4 h-4" aria-hidden="true" />,
      end: true,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    {
      to: '/institution/upload',
      label: t('nav.upload'),
      icon: <UploadCloud className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    {
      to: '/institution/batches',
      label: t('nav.batches', 'Batch Registry'),
      icon: <Layers className="w-4 h-4" aria-hidden="true" />,
      end: true,
      visible:
        !role ||
        role === 'INSTITUTION_ADMIN' ||
        role === 'INSTITUTION_STAFF' ||
        role === 'AICTE_ADMIN' ||
        role === 'AICTE_ANALYST' ||
        role === 'AICTE_VIEWER',
    },
    {
      to: '/institution/batches/batch-demo-2/review',
      label: t('nav.review'),
      icon: <CheckSquare className="w-4 h-4" aria-hidden="true" />,
      visible:
        !role ||
        role === 'INSTITUTION_ADMIN' ||
        role === 'INSTITUTION_STAFF' ||
        role === 'AICTE_ADMIN' ||
        role === 'AICTE_ANALYST' ||
        role === 'AICTE_VIEWER',
    },
    {
      to: '/institution/transfers',
      label: t('nav.transfers', 'Transfers Desk'),
      icon: <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    {
      to: '/institution/students',
      label: t('nav.students', 'Student Registry'),
      icon: <Users className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    {
      to: '/institution/aggregates',
      label: t('nav.aggregates', 'Aggregate Intake'),
      icon: <BarChart3 className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    {
      to: '/institution/audit',
      label: t('nav.audit_log', 'Document Audit & Revert'),
      icon: <History className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    // AICTE items
    {
      to: '/aicte',
      label: t('nav.aicte'),
      icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" />,
      visible:
        !role ||
        role === 'AICTE_ADMIN' ||
        role === 'AICTE_ANALYST' ||
        role === 'AICTE_VIEWER',
    },
    // DAB items
    {
      to: '/dab',
      label: t('nav.dab', 'DAB Portal & Degrees'),
      icon: <Scale className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'DAB_MEMBER' || role === 'DAB_ADMIN',
    },
    // Student items
    {
      to: '/student',
      label: t('nav.student'),
      icon: <Wallet className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'STUDENT',
    },
    // Verifier items
    {
      to: '/verify',
      label: t('nav.verifier'),
      icon: <ShieldCheck className="w-4 h-4" aria-hidden="true" />,
      visible: true,
    },
    // Employer items
    {
      to: '/employer',
      label: t('nav.employer', 'Employer Hiring Portal'),
      icon: <Briefcase className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'EMPLOYER' || role === 'AICTE_ADMIN',
    },
    // Reports
    {
      to: '/reports',
      label: t('nav.reports'),
      icon: <FileBarChart2 className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role !== 'STUDENT',
    },
    // Settings (Institution Admin)
    {
      to: '/settings',
      label: t('nav.settings'),
      icon: <Settings className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm min-h-[calc(100vh-100px)]">
      <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {role ? `${t(`roles.${role}`, role.replace('_', ' '))} ${t('shell.navigation', 'Navigation')}` : t('nav.portals_modules', 'Portals & Modules')}
        </div>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isReviewItem = item.to.includes('/review');
            const isBatchesItem = item.to === '/institution/batches';

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? (!isReviewItem)}
                className={({ isActive }) => {
                  const effectivelyActive = isReviewItem
                    ? location.pathname.includes('/review')
                    : isBatchesItem
                    ? location.pathname === '/institution/batches' ||
                      (location.pathname.startsWith('/institution/batches') && !location.pathname.includes('/review'))
                    : isActive;

                  return `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    effectivelyActive
                      ? 'bg-gov-navy text-white shadow-sm font-semibold'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-gov-navy'
                  }`;
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
        {/* Dark Mode Switcher */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="w-4 h-4 text-gov-saffron" aria-hidden="true" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isDark ? t('shell.dark_mode', 'Dark Mode') : t('shell.light_mode', 'Light Mode')}
            </span>
          </div>
          <button
            id="dark-mode-toggle"
            data-testid="dark-mode-toggle"
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gov-saffron focus:ring-offset-1 ${
              isDark ? 'bg-gov-saffron' : 'bg-slate-300'
            }`}
            aria-label="Toggle Dark Mode"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isDark ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isAuthenticated && user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout', 'Sign Out')} ({user.email.split('@')[0]})</span>
          </button>
        ) : (
          <NavLink
            to="/login"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gov-navy hover:bg-gov-navy/10 rounded-lg transition"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('nav.signin_portal', 'Sign In to Portal')}</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
};
