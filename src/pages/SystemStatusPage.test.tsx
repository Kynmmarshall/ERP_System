import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SystemStatusPage } from '@/pages/SystemStatusPage'

function renderWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <SystemStatusPage />
    </QueryClientProvider>,
  )
}

describe('SystemStatusPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows every service as online when all health checks succeed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', service: 'academic' }),
      }),
    )

    renderWithClient()

    await waitFor(() => {
      expect(screen.getAllByText('Online')).toHaveLength(5)
    })
  })

  it('surfaces a failing service as unreachable instead of hiding the error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      }),
    )

    renderWithClient()

    await waitFor(() => {
      expect(screen.getAllByText('Unreachable').length).toBeGreaterThan(0)
    })
  })
})
