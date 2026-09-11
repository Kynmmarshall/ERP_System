import { createBrowserRouter } from 'react-router-dom'

import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
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
      { path: 'academic', element: <PlaceholderModulePage title="Academic" /> },
      { path: 'finance', element: <PlaceholderModulePage title="Finance & Marketing" /> },
      { path: 'people', element: <PlaceholderModulePage title="People & Operations" /> },
      { path: 'settings', element: <PlaceholderModulePage title="Settings" /> },
      { path: 'status', element: <SystemStatusPage /> },
    ],
  },
])
