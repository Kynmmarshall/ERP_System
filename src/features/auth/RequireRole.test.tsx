import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { RequireRole } from '@/features/auth/RequireRole'
import { ADMIN_ROLES, STAFF_ROLES } from '@/features/auth/roles'
import type { Role } from '@/types/auth'

function stubSessionAs(role: Role) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/v1/auth/refresh')) {
      return new Response(JSON.stringify({ access_token: 't', token_type: 'bearer' }), { status: 200 })
    }
    if (url.includes('/api/v1/auth/me')) {
      return new Response(
        JSON.stringify({
          id: 'u1',
          email: `${role}@ictuniversity.example`,
          full_name: `${role} user`,
          role,
          institution_id: 'inst-1',
          campus_id: 'campus-1',
        }),
        { status: 200 },
      )
    }
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
}

function renderGuarded(allowed: readonly Role[]) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <RequireRole allowed={allowed}>
            <div>Protected content</div>
          </RequireRole>
        ),
      },
    ],
    { initialEntries: ['/'] },
  )
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('RequireRole', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(['student'] as const)('denies %s access to an admin-only area', async (role) => {
    stubSessionAs(role)
    renderGuarded(ADMIN_ROLES)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /do not have access|limited to/i,
    )
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('denies staff access to an admin-only area', async () => {
    stubSessionAs('lecturer')
    renderGuarded(ADMIN_ROLES)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('allows admin into an admin-only area', async () => {
    stubSessionAs('admin')
    renderGuarded(ADMIN_ROLES)

    await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('denies a student access to a staff-only area', async () => {
    stubSessionAs('student')
    renderGuarded(STAFF_ROLES)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it.each(['lecturer', 'finance_staff', 'marketing', 'admin'] as const)(
    'allows %s into a staff-only area',
    async (role) => {
      stubSessionAs(role)
      renderGuarded(STAFF_ROLES)

      await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument())
    },
  )

  it('tells the denied user which roles are required, not just that it failed', async () => {
    stubSessionAs('student')
    renderGuarded(ADMIN_ROLES)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Admin/)
    expect(alert).toHaveTextContent(/Your role is Student/)
  })
})
