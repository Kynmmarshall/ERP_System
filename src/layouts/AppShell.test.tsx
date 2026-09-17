import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { AppShell } from '@/layouts/AppShell'
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
          email: 'someone@ictuniversity.example',
          full_name: 'Ada Nkeng',
          role,
          institution_id: 'inst-1',
        }),
        { status: 200 },
      )
    }
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
}

function renderShell() {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppShell />, children: [{ index: true, element: <div>Page body</div> }] }],
    { initialEntries: ['/'] },
  )
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('AppShell', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('offers a way to log out from the mobile menu, not only the desktop sidebar', async () => {
    // The sidebar holding the desktop logout is `hidden lg:flex`, so on a phone
    // the drawer is the only route to it. jsdom applies no CSS, so both copies
    // are in the DOM and counting them is what actually proves the drawer has
    // its own.
    stubSessionAs('student')
    renderShell()
    await screen.findByText('Ada Nkeng')

    expect(screen.getAllByRole('button', { name: /log out/i })).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: /open navigation/i }))

    expect(screen.getAllByRole('button', { name: /log out/i })).toHaveLength(2)
  })

  it('keeps the mobile header pinned while the page scrolls', () => {
    stubSessionAs('student')
    renderShell()

    const header = document.querySelector('header')!
    expect(header.className).toContain('sticky')
    expect(header.className).toContain('top-0')
    // Without an opaque background the page content shows through it.
    expect(header.className).toContain('bg-background')
  })
})
