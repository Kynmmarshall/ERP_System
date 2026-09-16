import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CoursesPanel } from '@/features/academic/CoursesPanel'
import type { Enrollment } from '@/types/academic'

const mockFetchCourses = vi.fn()
const mockFetchCourseOfferings = vi.fn()
const mockFetchMyCourseRegistrations = vi.fn()
const mockFetchMyAtRiskStatus = vi.fn()
const mockRegisterForCourse = vi.fn()
const mockDownloadTranscript = vi.fn()
const mockDownloadAttendanceSummary = vi.fn()
const mockFetchAssessments = vi.fn()
const mockFetchGrades = vi.fn()
const mockSubmitGradeAppeal = vi.fn()

vi.mock('@/services/academicService', () => ({
  fetchCourses: () => mockFetchCourses(),
  fetchCourseOfferings: () => mockFetchCourseOfferings(),
  fetchMyCourseRegistrations: () => mockFetchMyCourseRegistrations(),
  fetchMyAtRiskStatus: () => mockFetchMyAtRiskStatus(),
  registerForCourse: (input: unknown) => mockRegisterForCourse(input),
  downloadTranscript: () => mockDownloadTranscript(),
  downloadAttendanceSummary: () => mockDownloadAttendanceSummary(),
  fetchAssessments: (id: string) => mockFetchAssessments(id),
  fetchGrades: (id: string) => mockFetchGrades(id),
  submitGradeAppeal: (gradeId: string, reason: string) => mockSubmitGradeAppeal(gradeId, reason),
}))

const enrollment: Enrollment = {
  id: 'enr-1',
  programId: 'prog-1',
  termId: 'term-1',
  studentId: 'student-1',
  status: 'accepted',
  createdAt: '2026-01-01T00:00:00Z',
}

function renderPanel(enrollments: Enrollment[] = [enrollment]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <CoursesPanel enrollments={enrollments} />
    </QueryClientProvider>,
  )
}

describe('CoursesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchCourses.mockResolvedValue([{ id: 'course-1', programId: 'prog-1', code: 'CS101', name: 'Intro to CS', credits: 3 }])
    mockFetchCourseOfferings.mockResolvedValue([
      { id: 'offering-1', courseId: 'course-1', termId: 'term-1', instructorId: 'instr-1', room: 'A1', capacity: 30 },
    ])
    mockFetchMyCourseRegistrations.mockResolvedValue([])
    mockFetchMyAtRiskStatus.mockResolvedValue([])
    mockFetchAssessments.mockResolvedValue([])
  })

  it('lists an available course and registers for it', async () => {
    const user = userEvent.setup()
    mockRegisterForCourse.mockResolvedValue({
      id: 'reg-1',
      studentId: 'student-1',
      enrollmentId: 'enr-1',
      courseOfferingId: 'offering-1',
      createdAt: '2026-01-01T00:00:00Z',
    })

    renderPanel()

    expect(await screen.findByText(/Intro to CS/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() =>
      expect(mockRegisterForCourse).toHaveBeenCalledWith({ enrollmentId: 'enr-1', courseOfferingId: 'offering-1' }),
    )
  })

  it('shows a registered course with its at-risk status', async () => {
    mockFetchMyCourseRegistrations.mockResolvedValue([
      { id: 'reg-1', studentId: 'student-1', enrollmentId: 'enr-1', courseOfferingId: 'offering-1', createdAt: '2026-01-01T00:00:00Z' },
    ])
    mockFetchMyAtRiskStatus.mockResolvedValue([
      { studentId: 'student-1', courseOfferingId: 'offering-1', attendanceRate: 0.5, assessmentAverage: null, atRisk: true },
    ])

    renderPanel()

    expect(await screen.findByText('At risk')).toBeInTheDocument()
    expect(screen.getByText(/Attendance: 50%/)).toBeInTheDocument()
  })

  it('shows a published grade and submits an appeal', async () => {
    const user = userEvent.setup()
    mockFetchMyCourseRegistrations.mockResolvedValue([
      { id: 'reg-1', studentId: 'student-1', enrollmentId: 'enr-1', courseOfferingId: 'offering-1', createdAt: '2026-01-01T00:00:00Z' },
    ])
    mockFetchAssessments.mockResolvedValue([{ id: 'assess-1', courseOfferingId: 'offering-1', name: 'Midterm', maxScore: 100 }])
    mockFetchGrades.mockResolvedValue([{ id: 'grade-1', assessmentId: 'assess-1', studentId: 'student-1', score: 40, published: true }])
    mockSubmitGradeAppeal.mockResolvedValue({
      id: 'appeal-1',
      gradeId: 'grade-1',
      studentId: 'student-1',
      reason: 'Miscounted',
      status: 'submitted',
      reviewerNotes: null,
      decidedBy: null,
      decidedAt: null,
    })

    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'View grades' }))
    expect(await screen.findByText('40/100')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Appeal this grade' }))
    await user.type(screen.getByPlaceholderText(/explain why/i), 'Miscounted question 4')
    await user.click(screen.getByRole('button', { name: 'Submit appeal' }))

    await waitFor(() => expect(mockSubmitGradeAppeal).toHaveBeenCalledWith('grade-1', 'Miscounted question 4'))
    expect(await screen.findByText('Appeal submitted')).toBeInTheDocument()
  })
})
