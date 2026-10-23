import React from 'react';
import { NavLink } from 'react-router-dom';
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
  LogIn,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    {
      to: '/institution',
      label: t('nav.institution'),
      icon: <Building2 className="w-4 h-4" aria-hidden="true" />,
      end: true,
    },
    {
      to: '/institution/upload',
      label: t('nav.upload'),
      icon: <UploadCloud className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/institution/batches/batch-demo-2/review',
      label: t('nav.review'),
      icon: <CheckSquare className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/institution/transfers',
      label: t('nav.transfers'),
      icon: <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/aicte',
      label: t('nav.aicte'),
      icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/student',
      label: t('nav.student'),
      icon: <Wallet className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/verify',
      label: t('nav.verifier'),
      icon: <ShieldCheck className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/reports',
      label: t('nav.reports'),
      icon: <FileBarChart2 className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/settings',
      label: t('nav.settings'),
      icon: <Settings className="w-4 h-4" aria-hidden="true" />,
    },
    {
      to: '/login',
      label: t('nav.login'),
      icon: <LogIn className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm min-h-[calc(100vh-100px)]">
      <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Portals & Modules
        </div>
        {navItems.map((item) => (
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

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
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
