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

/** Mirrors the real backend: password step returns a challenge (no token),
 * and only /mfa/verify hands out a session. */
function stubAdminMfaBackend({ correctCode }: { correctCode: string }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/api/v1/auth/refresh')) {
      return new Response(null, { status: 401 })
    }
    if (url.includes('/api/v1/auth/login')) {
      return new Response(
        JSON.stringify({ mfa_required: true, challenge_id: 'chal-1', expires_in_seconds: 600 }),
        { status: 200 },
      )
    }
    if (url.includes('/api/v1/auth/mfa/verify')) {
      const body = JSON.parse(String(init?.body ?? '{}'))
      if (body.code !== correctCode) {
        return new Response(JSON.stringify({ detail: 'Invalid or expired code' }), { status: 401 })
      }
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
          campus_id: 'campus-1',
        }),
        { status: 200 },
      )
    }
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function submitPassword(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByLabelText('Email')).toBeEnabled())
  await user.type(screen.getByLabelText('Email'), 'admin@ictuniversity.example')
  await user.type(screen.getByLabelText('Password'), 'correct horse battery staple')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('Admin MFA login', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks for a code instead of signing in when the backend requires MFA', async () => {
    const user = userEvent.setup()
    stubAdminMfaBackend({ correctCode: '123456' })

    renderLoginPage()
    await submitPassword(user)

    expect(await screen.findByLabelText('6-digit code')).toBeInTheDocument()
    // Critically: the password step alone must NOT have signed anyone in.
    expect(screen.queryByText('Overview page')).not.toBeInTheDocument()
  })

  it('completes the sign-in once the correct code is entered', async () => {
    const user = userEvent.setup()
    stubAdminMfaBackend({ correctCode: '123456' })

    renderLoginPage()
    await submitPassword(user)

    await user.type(await screen.findByLabelText('6-digit code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verify and sign in' }))

    await waitFor(() => expect(screen.getByText('Overview page')).toBeInTheDocument())
  })

  it('shows an error and stays on the code step for a wrong code', async () => {
    const user = userEvent.setup()
    stubAdminMfaBackend({ correctCode: '123456' })

    renderLoginPage()
    await submitPassword(user)

    await user.type(await screen.findByLabelText('6-digit code'), '000000')
    await user.click(screen.getByRole('button', { name: 'Verify and sign in' }))

    expect(await screen.findByText('Invalid or expired code')).toBeInTheDocument()
    expect(screen.queryByText('Overview page')).not.toBeInTheDocument()
    expect(screen.getByLabelText('6-digit code')).toBeInTheDocument()
  })

  it('ignores non-digits typed into the code field', async () => {
    const user = userEvent.setup()
    stubAdminMfaBackend({ correctCode: '123456' })

    renderLoginPage()
    await submitPassword(user)

    const codeInput = await screen.findByLabelText('6-digit code')
    await user.type(codeInput, '12ab34')

    expect(codeInput).toHaveValue('1234')
  })
})
