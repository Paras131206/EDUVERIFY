import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { Footer } from './Footer';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-gov-text">
      <OfflineBanner />
      <TopBar />
      <div className="flex-1 flex flex-row">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};
