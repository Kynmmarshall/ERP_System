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
      // Students share these two routes with staff; each page renders the
      // caller's own view. A lecturer has no finance permissions and finance
      // staff have no teaching permissions, so they are kept out entirely
      // rather than shown a workspace that 403s on every call.
      {
        path: 'academic',
        element: (
          <RequireRole allowed={ACADEMIC_PAGE_ROLES}>
            <EnrollmentPage />
          </RequireRole>
        ),
      },
      {
        path: 'finance',
        element: (
          <RequireRole allowed={FINANCE_PAGE_ROLES}>
            <FinancePage />
          </RequireRole>
        ),
      },
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
