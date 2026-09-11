import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FinancePage } from '@/features/finance/FinancePage'

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockFetchMyInvoices = vi.fn()
const mockCreatePaymentIntent = vi.fn()
const mockFetchPaymentIntent = vi.fn()
const mockDownloadReceipt = vi.fn()

vi.mock('@/services/financeService', () => ({
  fetchMyInvoices: () => mockFetchMyInvoices(),
  createPaymentIntent: (invoiceId: string, payerMsisdn: string) => mockCreatePaymentIntent(invoiceId, payerMsisdn),
  fetchPaymentIntent: (intentId: string) => mockFetchPaymentIntent(intentId),
  downloadReceipt: (invoiceId: string) => mockDownloadReceipt(invoiceId),
}))

const studentPrincipal = {
  id: 'student-1',
  email: 'student@example.com',
  fullName: 'Test Student',
  role: 'student' as const,
  institutionId: 'inst-1',
  campusId: 'campus-1',
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <FinancePage />
    </QueryClientProvider>,
  )
}

describe('FinancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ principal: studentPrincipal })
  })

  it('shows a placeholder for non-student roles', async () => {
    mockUseAuth.mockReturnValue({ principal: { ...studentPrincipal, role: 'staff' } })
    mockFetchMyInvoices.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Not built yet')).toBeInTheDocument()
  })

  it('shows an empty state when there are no invoices', async () => {
    mockFetchMyInvoices.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No invoices yet')).toBeInTheDocument()
  })

  it('lets a student pay a pending invoice and see it succeed', async () => {
    const user = userEvent.setup()
    mockFetchMyInvoices.mockResolvedValue([
      {
        id: 'invoice-1',
        enrollmentId: 'enr-1',
        studentId: 'student-1',
        amountXaf: 450_000,
        status: 'pending',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'intent-1',
      invoiceId: 'invoice-1',
      amountXaf: 450_000,
      provider: 'mtn_momo',
      providerReference: 'ref-1',
      status: 'pending',
      createdAt: '2026-01-01T00:00:00Z',
    })
    mockFetchPaymentIntent.mockResolvedValue({
      id: 'intent-1',
      invoiceId: 'invoice-1',
      amountXaf: 450_000,
      provider: 'mtn_momo',
      providerReference: 'ref-1',
      status: 'succeeded',
      createdAt: '2026-01-01T00:00:00Z',
    })

    renderPage()

    expect(await screen.findByText('450,000 XAF')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('6XXXXXXXX'), '677000000')
    await user.click(screen.getByRole('button', { name: 'Pay with CamerPay' }))

    await waitFor(() => expect(mockCreatePaymentIntent).toHaveBeenCalledWith('invoice-1', '677000000'))
    expect(await screen.findByText('Payment succeeded.')).toBeInTheDocument()
  })

  it('lets a student download a receipt for a paid invoice', async () => {
    const user = userEvent.setup()
    mockFetchMyInvoices.mockResolvedValue([
      {
        id: 'invoice-2',
        enrollmentId: 'enr-2',
        studentId: 'student-1',
        amountXaf: 450_000,
        status: 'paid',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Download receipt' }))

    expect(mockDownloadReceipt).toHaveBeenCalledWith('invoice-2')
  })
})
