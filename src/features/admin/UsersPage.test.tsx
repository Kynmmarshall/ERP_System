import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { UsersPage } from '@/features/admin/UsersPage'
import type { Role } from '@/types/auth'

const OTHER_USER_ID = 'u2'
const SELF_ID = 'u1'

function stubBackend({ actorRole, users }: { actorRole: Role; users: unknown[] }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/v1/auth/refresh')) {
      return new Response(JSON.stringify({ access_token: 't', token_type: 'bearer' }), { status: 200 })
    }
    if (url.includes('/api/v1/auth/users')) {
      if (url.match(/\/users\/[^/]+\/role$/)) {
        return new Response(JSON.stringify(users[1]), { status: 200 })
      }
      return new Response(JSON.stringify(users), { status: 200 })
    }
    if (url.includes('/api/v1/auth/me')) {
      return new Response(
        JSON.stringify({
          id: SELF_ID,
          email: 'me@ictuniversity.example',
          full_name: 'Me',
          role: actorRole,
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

function userRow(id: string, role: Role, fullName: string) {
  return {
    id,
    email: `${id}@ictuniversity.example`,
    full_name: fullName,
    role,
    is_active: true,
    campus_id: 'campus-1',
    created_at: '2026-01-01T00:00:00Z',
  }
}

function renderUsersPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <UsersPage />
      </QueryClientProvider>
    </AuthProvider>,
  )
}

describe('UsersPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists users with their roles', async () => {
    stubBackend({
      actorRole: 'admin',
      users: [userRow(SELF_ID, 'admin', 'Me'), userRow(OTHER_USER_ID, 'student', 'A Student')],
    })

    renderUsersPage()

    expect(await screen.findByText('A Student')).toBeInTheDocument()
    expect(screen.getByText('(you)')).toBeInTheDocument()
  })

  it('does not let an admin change their own role', async () => {
    stubBackend({
      actorRole: 'admin',
      users: [userRow(SELF_ID, 'admin', 'Me'), userRow(OTHER_USER_ID, 'student', 'A Student')],
    })

    renderUsersPage()
    await screen.findByText('A Student')

    expect(screen.getByLabelText('Role', { selector: `#role-${SELF_ID}` })).toBeDisabled()
    expect(screen.getByLabelText('Role', { selector: `#role-${OTHER_USER_ID}` })).toBeEnabled()
  })

  it('does not let a plain admin edit a super admin', async () => {
    stubBackend({
      actorRole: 'admin',
      users: [userRow(SELF_ID, 'admin', 'Me'), userRow(OTHER_USER_ID, 'super_admin', 'The Owner')],
    })

    renderUsersPage()
    await screen.findByText('The Owner')

    expect(screen.getByLabelText('Role', { selector: `#role-${OTHER_USER_ID}` })).toBeDisabled()
  })

  it('lets a super admin edit another super admin', async () => {
    stubBackend({
      actorRole: 'super_admin',
      users: [userRow(SELF_ID, 'super_admin', 'Me'), userRow(OTHER_USER_ID, 'super_admin', 'Peer')],
    })

    renderUsersPage()
    await screen.findByText('Peer')

    expect(screen.getByLabelText('Role', { selector: `#role-${OTHER_USER_ID}` })).toBeEnabled()
  })

  it('sends a role change to the API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubBackend({
      actorRole: 'admin',
      users: [userRow(SELF_ID, 'admin', 'Me'), userRow(OTHER_USER_ID, 'student', 'A Student')],
    })

    renderUsersPage()
    await screen.findByText('A Student')

    await user.selectOptions(
      screen.getByLabelText('Role', { selector: `#role-${OTHER_USER_ID}` }),
      'staff',
    )

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes(`/api/v1/auth/users/${OTHER_USER_ID}/role`),
        ),
      ).toBe(true),
    )
  })
})
