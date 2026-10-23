import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { InstitutionDashboardPage } from '@/features/institution/InstitutionDashboardPage';
import { UploadPage } from '@/features/institution/UploadPage';
import { ReviewPage } from '@/features/institution/ReviewPage';
import { TransfersPage } from '@/features/institution/TransfersPage';
import { AicteDashboardPage } from '@/features/aicte/AicteDashboardPage';
import { StudentWalletPage } from '@/features/student/StudentWalletPage';
import { VerifierPage } from '@/features/verifier/VerifierPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export const router = createBrowserRouter([
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
      {
        path: 'institution',
        element: <InstitutionDashboardPage />,
      },
      {
        path: 'institution/upload',
        element: <UploadPage />,
      },
      {
        path: 'institution/batches/:id/review',
        element: <ReviewPage />,
      },
      {
        path: 'institution/transfers',
        element: <TransfersPage />,
      },
      {
        path: 'aicte',
        element: <AicteDashboardPage />,
      },
      {
        path: 'student',
        element: <StudentWalletPage />,
      },
      {
        path: 'verify',
        element: <VerifierPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/institution" replace />,
      },
    ],
  },
]);
