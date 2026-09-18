import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { RegisterPage } from '@/features/auth/RegisterPage'

function renderRegisterPage() {
  const router = createMemoryRouter(
    [
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <div>Login page</div> },
      { path: '/', element: <div>Overview page</div> },
    ],
    { initialEntries: ['/register'] },
  )
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('RegisterPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates an account and navigates away on success', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/v1/auth/refresh')) {
        return new Response(null, { status: 401 })
      }
      if (url.includes('/api/v1/auth/register')) {
        return new Response(JSON.stringify({ access_token: 'token123', token_type: 'bearer' }), {
          status: 201,
        })
      }
      if (url.includes('/api/v1/auth/me')) {
        return new Response(
          JSON.stringify({
            id: 'u1',
            email: 'new-student@ictuniversity.example',
            full_name: 'New Student',
            role: 'student',
            institution_id: 'inst-1',
            campus_id: null,
          }),
          { status: 200 },
        )
      }
      return new Response(null, { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderRegisterPage()

    await waitFor(() => expect(screen.getByLabelText('Full name')).toBeEnabled())

    await user.type(screen.getByLabelText('Full name'), 'New Student')
    await user.type(screen.getByLabelText('Email'), 'new-student@ictuniversity.example')
    await user.type(screen.getByLabelText('Password'), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(screen.getByText('Overview page')).toBeInTheDocument())
  })

  it('shows an error message on a duplicate email without navigating away', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/v1/auth/refresh')) {
        return new Response(null, { status: 401 })
      }
      if (url.includes('/api/v1/auth/register')) {
        return new Response(JSON.stringify({ detail: 'An account with this email already exists' }), {
          status: 409,
        })
      }
      return new Response(null, { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderRegisterPage()

    await waitFor(() => expect(screen.getByLabelText('Full name')).toBeEnabled())

    await user.type(screen.getByLabelText('Full name'), 'New Student')
    await user.type(screen.getByLabelText('Email'), 'taken@ictuniversity.example')
    await user.type(screen.getByLabelText('Password'), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument()
    expect(screen.queryByText('Overview page')).not.toBeInTheDocument()
  })

  it('shows a validation error and never calls the API for a too-short password', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      void input
      return new Response(null, { status: 401 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderRegisterPage()

    await waitFor(() => expect(screen.getByLabelText('Full name')).toBeEnabled())

    await user.type(screen.getByLabelText('Full name'), 'New Student')
    await user.type(screen.getByLabelText('Email'), 'new-student@ictuniversity.example')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/auth/register'))).toBe(false)
  })

  it('links back to the login page', async () => {
    renderRegisterPage()

    await waitFor(() => expect(screen.getByLabelText('Full name')).toBeEnabled())

    await userEvent.setup().click(screen.getByRole('link', { name: 'Sign in' }))

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument())
  })
})
