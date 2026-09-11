import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'

function renderLoginPage() {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/', element: <div>Overview page</div> },
    ],
    { initialEntries: ['/login'] },
  )
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('signs in and navigates away on valid credentials', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/v1/auth/refresh')) {
        return new Response(null, { status: 401 })
      }
      if (url.includes('/api/v1/auth/login')) {
        return new Response(JSON.stringify({ access_token: 'token123', token_type: 'bearer' }), {
          status: 200,
        })
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
    })
    vi.stubGlobal('fetch', fetchMock)

    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText('Email')).toBeEnabled())

    await user.type(screen.getByLabelText('Email'), 'admin@ictuniversity.example')
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(screen.getByText('Overview page')).toBeInTheDocument())
  })

  it('shows an error message on invalid credentials without navigating away', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/v1/auth/refresh')) {
        return new Response(null, { status: 401 })
      }
      if (url.includes('/api/v1/auth/login')) {
        return new Response(JSON.stringify({ detail: 'Invalid credentials' }), { status: 401 })
      }
      return new Response(null, { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText('Email')).toBeEnabled())

    await user.type(screen.getByLabelText('Email'), 'admin@ictuniversity.example')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(screen.queryByText('Overview page')).not.toBeInTheDocument()
  })

  it('shows a validation error and never calls the API for an empty form submit', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async () => new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText('Email')).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1) // only the silent refresh-on-mount call
  })
})
