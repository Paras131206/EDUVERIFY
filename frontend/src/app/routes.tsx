import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, RequireRole } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { InstitutionDashboardPage } from '@/features/institution/InstitutionDashboardPage';
import { UploadPage } from '@/features/institution/UploadPage';
import { BatchListPage } from '@/features/institution/BatchListPage';
import { ReviewPage } from '@/features/institution/ReviewPage';
import { TransfersPage } from '@/features/institution/TransfersPage';
import { StudentsPage } from '@/features/institution/StudentsPage';
import { AggregatesPage } from '@/features/institution/AggregatesPage';
import { AicteDashboardPage } from '@/features/aicte/AicteDashboardPage';
import { DabDashboardPage } from '@/features/dab/DabDashboardPage';
import { StudentWalletPage } from '@/features/student/StudentWalletPage';
import { VerifierPage } from '@/features/verifier/VerifierPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AuthorityAccessPage } from '@/features/reports/AuthorityAccessPage';
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
        path: '/auth-access',
        element: <AuthorityAccessPage />,
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
            path: 'institution/batches',
            element: (
              <RequireRole
                roles={[
                  'INSTITUTION_ADMIN',
                  'INSTITUTION_STAFF',
                  'AICTE_ADMIN',
                  'AICTE_ANALYST',
                  'AICTE_VIEWER',
                ]}
              >
                <BatchListPage />
              </RequireRole>
            ),
          },
          {
            path: 'institution/batches/:id/review',
            element: (
              <RequireRole
                roles={[
                  'INSTITUTION_ADMIN',
                  'INSTITUTION_STAFF',
                  'AICTE_ADMIN',
                  'AICTE_ANALYST',
                  'AICTE_VIEWER',
                ]}
              >
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
          {
            path: 'institution/students',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_STAFF']}>
                <StudentsPage />
              </RequireRole>
            ),
          },
          {
            path: 'institution/aggregates',
            element: (
              <RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_STAFF']}>
                <AggregatesPage />
              </RequireRole>
            ),
          },
          // AICTE Console
          {
            path: 'aicte',
            element: (
              <RequireRole roles={['AICTE_ADMIN', 'AICTE_ANALYST', 'AICTE_VIEWER']}>
                <AicteDashboardPage />
              </RequireRole>
            ),
          },
          // DAB Portal (DAB_ADMIN / DAB_MEMBER)
          {
            path: 'dab',
            element: (
              <RequireRole roles={['DAB_ADMIN', 'DAB_MEMBER']}>
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
          // Verifier Desk (Public + VERIFIER)
          {
            path: 'verify',
            element: <VerifierPage />,
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
                  'AICTE_ANALYST',
                  'AICTE_VIEWER',
                  'DAB_ADMIN',
                  'DAB_MEMBER',
                  'VERIFIER',
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
            path: 'settings/webhooks',
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
