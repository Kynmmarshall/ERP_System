import { createBrowserRouter } from 'react-router-dom'

import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { EnrollmentPage } from '@/features/academic/EnrollmentPage'
import { FinancePage } from '@/features/finance/FinancePage'
import { HRPage } from '@/features/hr/HRPage'
import { AppShell } from '@/layouts/AppShell'
import { OverviewPage } from '@/pages/OverviewPage'
import { PlaceholderModulePage } from '@/pages/PlaceholderModulePage'
import { SystemStatusPage } from '@/pages/SystemStatusPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'academic', element: <EnrollmentPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'people', element: <HRPage /> },
      { path: 'settings', element: <PlaceholderModulePage title="Settings" /> },
      { path: 'status', element: <SystemStatusPage /> },
    ],
  },
])
