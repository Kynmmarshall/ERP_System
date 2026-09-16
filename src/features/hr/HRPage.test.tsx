import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HRPage } from '@/features/hr/HRPage'

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockFetchMyLeaveRequests = vi.fn()
const mockSubmitLeaveRequest = vi.fn()
const mockFetchMyAttendance = vi.fn()
const mockCheckIn = vi.fn()
const mockFetchMyPayslips = vi.fn()
const mockFetchMyNotifications = vi.fn()
const mockMarkNotificationRead = vi.fn()
const mockFetchLeaveRequests = vi.fn()
const mockFetchEmployees = vi.fn()

vi.mock('@/services/hrService', () => ({
  fetchMyLeaveRequests: () => mockFetchMyLeaveRequests(),
  submitLeaveRequest: (input: unknown) => mockSubmitLeaveRequest(input),
  fetchMyAttendance: () => mockFetchMyAttendance(),
  checkIn: (token: string) => mockCheckIn(token),
  fetchMyPayslips: () => mockFetchMyPayslips(),
  fetchMyNotifications: () => mockFetchMyNotifications(),
  markNotificationRead: (id: string) => mockMarkNotificationRead(id),
  fetchLeaveRequests: () => mockFetchLeaveRequests(),
  fetchEmployees: () => mockFetchEmployees(),
  decideLeaveRequest: vi.fn(),
}))

const staffPrincipal = {
  id: 'staff-1',
  email: 'staff@example.com',
  fullName: 'Test Staff',
  role: 'staff' as const,
  institutionId: 'inst-1',
  campusId: null,
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HRPage />
    </QueryClientProvider>,
  )
}

describe('HRPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ principal: staffPrincipal })
    mockFetchMyLeaveRequests.mockResolvedValue([])
    mockFetchMyAttendance.mockResolvedValue([])
    mockFetchMyPayslips.mockResolvedValue([])
    mockFetchMyNotifications.mockResolvedValue([])
    mockFetchLeaveRequests.mockResolvedValue([])
    mockFetchEmployees.mockResolvedValue([])
  })

  it('shows the admin workspace for non-staff roles', async () => {
    mockUseAuth.mockReturnValue({ principal: { ...staffPrincipal, role: 'admin' } })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'People workspace' })).toBeInTheDocument()
    expect(await screen.findByText('Nothing pending')).toBeInTheDocument()
  })

  it('shows empty states for a staff member with no data yet', async () => {
    renderPage()

    expect(await screen.findByText('No leave requests yet')).toBeInTheDocument()
    expect(await screen.findByText('No check-ins yet')).toBeInTheDocument()
    expect(await screen.findByText('No payslips yet')).toBeInTheDocument()
    expect(await screen.findByText('No notifications')).toBeInTheDocument()
  })

  it('lets staff submit a leave request', async () => {
    const user = userEvent.setup()
    mockSubmitLeaveRequest.mockResolvedValue({
      id: 'leave-1',
      startsOn: '2024-07-01',
      endsOn: '2024-07-05',
      reason: 'Family event',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00Z',
    })

    renderPage()
    await screen.findByText('No leave requests yet')

    await user.type(screen.getByLabelText('Starts on'), '2024-07-01')
    await user.type(screen.getByLabelText('Ends on'), '2024-07-05')
    await user.type(screen.getByLabelText('Reason'), 'Family event')
    await user.click(screen.getByRole('button', { name: 'Request leave' }))

    expect(mockSubmitLeaveRequest).toHaveBeenCalledWith({
      startsOn: '2024-07-01',
      endsOn: '2024-07-05',
      reason: 'Family event',
    })
  })

  it('lets staff check in with a code', async () => {
    const user = userEvent.setup()
    mockCheckIn.mockResolvedValue({ id: 'rec-1', shiftId: 'shift-1', checkedInAt: '2024-01-01T08:00:00Z' })

    renderPage()
    await screen.findByText('No check-ins yet')

    await user.type(screen.getByLabelText('Shift QR code / check-in code'), 'a-token-value')
    await user.click(screen.getByRole('button', { name: 'Check in' }))

    expect(mockCheckIn).toHaveBeenCalledWith('a-token-value')
    expect(await screen.findByText('Checked in.')).toBeInTheDocument()
  })

  it('shows payslips once available', async () => {
    mockFetchMyPayslips.mockResolvedValue([
      {
        id: 'payslip-1',
        period: '2024-06-01',
        grossXaf: 500_000,
        cnpsEmployeeXaf: 21_000,
        taxableBaseXaf: 335_300,
        irppXaf: 43_825,
        netXaf: 435_175,
      },
    ])

    renderPage()

    expect(await screen.findByText('2024-06-01')).toBeInTheDocument()
    expect(await screen.findByText('435,175 XAF net')).toBeInTheDocument()
  })

  it('lets staff mark a notification as read', async () => {
    const user = userEvent.setup()
    mockFetchMyNotifications.mockResolvedValue([
      { id: 'notif-1', message: 'Your leave request was approved.', createdAt: '2024-01-01T00:00:00Z', readAt: null },
    ])

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Mark read' }))

    expect(mockMarkNotificationRead).toHaveBeenCalledWith('notif-1')
  })
})
