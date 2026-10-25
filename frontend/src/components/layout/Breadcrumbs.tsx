import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Breadcrumbs: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <Link to="/" className="inline-flex items-center hover:text-gov-navy transition">
        <Home className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="sr-only">Home</span>
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const defaultLabel = value.charAt(0).toUpperCase() + value.slice(1);
        const formatted = t(`nav.${value}`, defaultLabel);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-400" aria-hidden="true" />
            {isLast ? (
              <span className="font-semibold text-slate-800" aria-current="page">
                {formatted}
              </span>
            ) : (
              <Link to={to} className="hover:text-gov-navy transition">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
