import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  LayoutDashboard,
  UploadCloud,
  CheckSquare,
  ArrowLeftRight,
  ShieldCheck,
  Wallet,
  FileBarChart2,
  Settings,
  Scale,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

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
      to: '/institution/batches/batch-demo-2/review',
      label: t('nav.review'),
      icon: <CheckSquare className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    {
      to: '/institution/transfers',
      label: t('nav.transfers'),
      icon: <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'INSTITUTION_ADMIN' || role === 'INSTITUTION_STAFF',
    },
    // AICTE items
    {
      to: '/aicte',
      label: t('nav.aicte'),
      icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'AICTE_ADMIN' || role === 'AICTE_VIEWER',
    },
    // DAB items
    {
      to: '/dab',
      label: 'DAB Appeals Docket',
      icon: <Scale className="w-4 h-4" aria-hidden="true" />,
      visible: !role || role === 'DAB_MEMBER',
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
          {role ? `${role.replace('_', ' ')} Navigation` : 'Portals & Modules'}
        </div>
        {navItems
          .filter((item) => item.visible)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gov-navy text-white shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-gov-navy'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
        {isAuthenticated && user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out ({user.email.split('@')[0]})</span>
          </button>
        ) : (
          <NavLink
            to="/login"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gov-navy hover:bg-gov-navy/10 rounded-lg transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Portal</span>
          </NavLink>
        )}

        <div className="bg-amber-50 rounded p-2.5 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
          <p className="font-semibold text-amber-800 flex items-center gap-1.5">
            <span>APAAR Keyed</span>
          </p>
          <p className="mt-0.5 text-slate-600">All data secured via 12-digit APAAR format with hash chain audit.</p>
        </div>
      </div>
    </aside>
  );
};
