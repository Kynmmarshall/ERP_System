import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EnrollmentPage } from '@/features/academic/EnrollmentPage'

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockFetchPrograms = vi.fn()
const mockFetchTerms = vi.fn()
const mockFetchEnrollments = vi.fn()
const mockCreateEnrollment = vi.fn()
const mockFetchCourses = vi.fn()
const mockFetchCourseOfferings = vi.fn()
const mockFetchMyCourseRegistrations = vi.fn()
const mockFetchMyAtRiskStatus = vi.fn()
vi.mock('@/services/academicService', () => ({
  fetchPrograms: () => mockFetchPrograms(),
  fetchTerms: () => mockFetchTerms(),
  fetchEnrollments: () => mockFetchEnrollments(),
  createEnrollment: (input: unknown) => mockCreateEnrollment(input),
  fetchCourses: () => mockFetchCourses(),
  fetchCourseOfferings: () => mockFetchCourseOfferings(),
  fetchMyCourseRegistrations: () => mockFetchMyCourseRegistrations(),
  fetchMyAtRiskStatus: () => mockFetchMyAtRiskStatus(),
  registerForCourse: vi.fn(),
  downloadTranscript: vi.fn(),
  downloadAttendanceSummary: vi.fn(),
}))

const mockFetchInvoiceForEnrollment = vi.fn()
vi.mock('@/services/financeService', () => ({
  fetchInvoiceForEnrollment: (id: string) => mockFetchInvoiceForEnrollment(id),
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EnrollmentPage />
    </QueryClientProvider>,
  )
}

const studentPrincipal = {
  id: 'student-1',
  email: 'student@example.com',
  fullName: 'Test Student',
  role: 'student' as const,
  institutionId: 'inst-1',
}

describe('EnrollmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ principal: studentPrincipal })
    mockFetchPrograms.mockResolvedValue([{ id: 'prog-1', name: 'BSc Software Engineering', code: 'SEN' }])
    mockFetchTerms.mockResolvedValue([
      { id: 'term-1', name: '2026 Semester 1', startsOn: '2026-01-01', endsOn: '2026-06-01' },
    ])
    mockFetchEnrollments.mockResolvedValue([])
    mockFetchInvoiceForEnrollment.mockResolvedValue(null)
    mockFetchCourses.mockResolvedValue([])
    mockFetchCourseOfferings.mockResolvedValue([])
    mockFetchMyCourseRegistrations.mockResolvedValue([])
    mockFetchMyAtRiskStatus.mockResolvedValue([])
  })

  it('shows the teaching workspace, not the student enrollment form, for staff', async () => {
    mockUseAuth.mockReturnValue({ principal: { ...studentPrincipal, role: 'lecturer' } })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Teaching workspace' })).toBeInTheDocument()
    expect(screen.queryByText('Enroll in a program')).not.toBeInTheDocument()
  })

  it('loads programs and terms and submits a new enrollment', async () => {
    const user = userEvent.setup()
    mockCreateEnrollment.mockResolvedValue({
      id: 'enr-1',
      programId: 'prog-1',
      termId: 'term-1',
      studentId: 'student-1',
      status: 'accepted',
      createdAt: '2026-01-01T00:00:00Z',
    })

    renderPage()

    await user.selectOptions(await screen.findByLabelText('Program'), 'prog-1')
    await user.selectOptions(screen.getByLabelText('Term'), 'term-1')
    await user.click(screen.getByRole('button', { name: 'Enroll' }))

    await waitFor(() =>
      expect(mockCreateEnrollment).toHaveBeenCalledWith({
        programId: 'prog-1',
        termId: 'term-1',
      }),
    )
  })

  it('shows an existing enrollment with its pending invoice status', async () => {
    mockFetchEnrollments.mockResolvedValue([
      {
        id: 'enr-2',
        programId: 'prog-1',
        termId: 'term-1',
        studentId: 'student-1',
        status: 'accepted',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])

    renderPage()

    expect(await screen.findByText('BSc Software Engineering')).toBeInTheDocument()
    expect(await screen.findByText('Pending…')).toBeInTheDocument()
  })
})
