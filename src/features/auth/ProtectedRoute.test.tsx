import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects to /login when there is no valid session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 401 })),
    )

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <ProtectedRoute>
              <div>Secret content</div>
            </ProtectedRoute>
          ),
        },
        { path: '/login', element: <div>Login page</div> },
      ],
      { initialEntries: ['/'] },
    )

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument())
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })

  it('renders the protected content when the session is valid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v1/auth/refresh')) {
          return new Response(JSON.stringify({ access_token: 'token123' }), { status: 200 })
        }
        if (url.includes('/api/v1/auth/me')) {
          return new Response(
            JSON.stringify({
              id: 'u1',
              email: 'admin@ictuniversity.example',
              full_name: 'ICT Admin',
              role: 'admin',
              institution_id: 'inst-1',
              campus_id: null,
            }),
            { status: 200 },
          )
        }
        return new Response(null, { status: 404 })
      }),
    )

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <ProtectedRoute>
              <div>Secret content</div>
            </ProtectedRoute>
          ),
        },
        { path: '/login', element: <div>Login page</div> },
      ],
      { initialEntries: ['/'] },
    )

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('Secret content')).toBeInTheDocument())
  })
})
