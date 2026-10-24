import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, RequireRole } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { InstitutionDashboardPage } from '@/features/institution/InstitutionDashboardPage';
import { UploadPage } from '@/features/institution/UploadPage';
import { ReviewPage } from '@/features/institution/ReviewPage';
import { TransfersPage } from '@/features/institution/TransfersPage';
import { AicteDashboardPage } from '@/features/aicte/AicteDashboardPage';
import { DabDashboardPage } from '@/features/dab/DabDashboardPage';
import { StudentWalletPage } from '@/features/student/StudentWalletPage';
import { VerifierPage } from '@/features/verifier/VerifierPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

const RootLayout: React.FC = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/institution" replace />,
          },
          // Institution Portal
          {
            path: 'institution',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_STAFF']}>
                <InstitutionDashboardPage />
              </RequireRole>
            ),
          },
          {
            path: 'institution/upload',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_STAFF']}>
                <UploadPage />
              </RequireRole>
            ),
          },
          {
            path: 'institution/batches/:id/review',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_STAFF']}>
                <ReviewPage />
              </RequireRole>
            ),
          },
          {
            path: 'institution/transfers',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_STAFF']}>
                <TransfersPage />
              </RequireRole>
            ),
          },
          // AICTE Console
          {
            path: 'aicte',
            element: (
              <RequireRole roles={['AICTE_ADMIN', 'AICTE_VIEWER']}>
                <AicteDashboardPage />
              </RequireRole>
            ),
          },
          // DAB Dispute Docket
          {
            path: 'dab',
            element: (
              <RequireRole roles={['DAB_MEMBER']}>
                <DabDashboardPage />
              </RequireRole>
            ),
          },
          // Student Credential Wallet
          {
            path: 'student',
            element: (
              <RequireRole roles={['STUDENT']}>
                <StudentWalletPage />
              </RequireRole>
            ),
          },
          // Verifier Desk
          {
            path: 'verify',
            element: (
              <RequireRole roles={['VERIFIER', 'AICTE_ADMIN', 'INSTITUTION_ADMIN']}>
                <VerifierPage />
              </RequireRole>
            ),
          },
          // Reports
          {
            path: 'reports',
            element: (
              <RequireRole
                roles={[
                  'INSTITUTION_ADMIN',
                  'INSTITUTION_STAFF',
                  'AICTE_ADMIN',
                  'AICTE_VIEWER',
                  'DAB_MEMBER',
                ]}
              >
                <ReportsPage />
              </RequireRole>
            ),
          },
          // Settings & API Keys (Institution Admin only)
          {
            path: 'settings',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN']}>
                <SettingsPage />
              </RequireRole>
            ),
          },
          {
            path: 'settings/api-keys',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN']}>
                <SettingsPage />
              </RequireRole>
            ),
          },
          {
            path: 'settings/users',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN']}>
                <SettingsPage />
              </RequireRole>
            ),
          },
          {
            path: '*',
            element: <Navigate to="/institution" replace />,
          },
        ],
      },
    ],
  },
]);
