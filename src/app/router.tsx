import { createBrowserRouter } from 'react-router-dom'

import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { RequireRole } from '@/features/auth/RequireRole'
import { ADMIN_ROLES, STAFF_ROLES } from '@/features/auth/roles'
import { EnrollmentPage } from '@/features/academic/EnrollmentPage'
import { FinancePage } from '@/features/finance/FinancePage'
import { HRPage } from '@/features/hr/HRPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { AppShell } from '@/layouts/AppShell'
import { OverviewPage } from '@/pages/OverviewPage'
import { SystemStatusPage } from '@/pages/SystemStatusPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      // Academic and Finance are open to every signed-in role: each page
      // renders the caller's own records, and the API scopes them by
      // ownership rather than by role.
      { path: 'academic', element: <EnrollmentPage /> },
      { path: 'finance', element: <FinancePage /> },
      {
        path: 'people',
        element: (
          <RequireRole allowed={STAFF_ROLES}>
            <HRPage />
          </RequireRole>
        ),
      },
      {
        path: 'settings',
        element: (
          <RequireRole allowed={ADMIN_ROLES}>
            <UsersPage />
          </RequireRole>
        ),
      },
      {
        path: 'status',
        element: (
          <RequireRole allowed={ADMIN_ROLES}>
            <SystemStatusPage />
          </RequireRole>
        ),
      },
    ],
  },
])
