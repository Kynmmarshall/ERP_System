import { authFetch, authFetchJson } from '@/services/apiClient'
import type {
  Assessment,
  AtRiskStatus,
  Course,
  CourseOffering,
  CourseRegistration,
  Enrollment,
  Grade,
  GradeAppeal,
  Program,
  Term,
} from '@/types/academic'

type ProgramResponse = { id: string; name: string; code: string }
type TermResponse = { id: string; name: string; starts_on: string; ends_on: string }
type EnrollmentResponse = {
  id: string
  program_id: string
  term_id: string
  campus_id: string
  student_id: string
  status: string
  created_at: string
}
type CourseResponse = { id: string; program_id: string; code: string; name: string; credits: number }
type CourseOfferingResponse = {
  id: string
  course_id: string
  term_id: string
  instructor_id: string
  room: string
  capacity: number
}
type CourseRegistrationResponse = {
  id: string
  student_id: string
  enrollment_id: string
  course_offering_id: string
  created_at: string
}
type AssessmentResponse = { id: string; course_offering_id: string; name: string; max_score: number }
type GradeResponse = { id: string; assessment_id: string; student_id: string; score: number; published: boolean }
type GradeAppealResponse = {
  id: string
  grade_id: string
  student_id: string
  reason: string
  status: GradeAppeal['status']
  reviewer_notes: string | null
  decided_by: string | null
  decided_at: string | null
}
type AtRiskStatusResponse = {
  student_id: string
  course_offering_id: string
  attendance_rate: number | null
  assessment_average: number | null
  at_risk: boolean
}

function toProgram(body: ProgramResponse): Program {
  return { id: body.id, name: body.name, code: body.code }
}

function toTerm(body: TermResponse): Term {
  return { id: body.id, name: body.name, startsOn: body.starts_on, endsOn: body.ends_on }
}

function toEnrollment(body: EnrollmentResponse): Enrollment {
  return {
    id: body.id,
    programId: body.program_id,
    termId: body.term_id,
    campusId: body.campus_id,
    studentId: body.student_id,
    status: body.status,
    createdAt: body.created_at,
  }
}

function toCourse(body: CourseResponse): Course {
  return { id: body.id, programId: body.program_id, code: body.code, name: body.name, credits: body.credits }
}

function toCourseOffering(body: CourseOfferingResponse): CourseOffering {
  return {
    id: body.id,
    courseId: body.course_id,
    termId: body.term_id,
    instructorId: body.instructor_id,
    room: body.room,
    capacity: body.capacity,
  }
}

function toCourseRegistration(body: CourseRegistrationResponse): CourseRegistration {
  return {
    id: body.id,
    studentId: body.student_id,
    enrollmentId: body.enrollment_id,
    courseOfferingId: body.course_offering_id,
    createdAt: body.created_at,
  }
}

function toAssessment(body: AssessmentResponse): Assessment {
  return { id: body.id, courseOfferingId: body.course_offering_id, name: body.name, maxScore: body.max_score }
}

function toGrade(body: GradeResponse): Grade {
  return { id: body.id, assessmentId: body.assessment_id, studentId: body.student_id, score: body.score, published: body.published }
}

function toGradeAppeal(body: GradeAppealResponse): GradeAppeal {
  return {
    id: body.id,
    gradeId: body.grade_id,
    studentId: body.student_id,
    reason: body.reason,
    status: body.status,
    reviewerNotes: body.reviewer_notes,
    decidedBy: body.decided_by,
    decidedAt: body.decided_at,
  }
}

function toAtRiskStatus(body: AtRiskStatusResponse): AtRiskStatus {
  return {
    studentId: body.student_id,
    courseOfferingId: body.course_offering_id,
    attendanceRate: body.attendance_rate,
    assessmentAverage: body.assessment_average,
    atRisk: body.at_risk,
  }
}

export async function fetchPrograms(): Promise<Program[]> {
  const body = await authFetchJson<ProgramResponse[]>('/api/v1/academic/programs')
  return body.map(toProgram)
}

export async function fetchTerms(): Promise<Term[]> {
  const body = await authFetchJson<TermResponse[]>('/api/v1/academic/terms')
  return body.map(toTerm)
}

export async function fetchEnrollments(): Promise<Enrollment[]> {
  const body = await authFetchJson<EnrollmentResponse[]>('/api/v1/academic/enrollments')
  return body.map(toEnrollment)
}

export async function createEnrollment(input: {
  programId: string
  termId: string
  campusId: string
}): Promise<Enrollment> {
  const body = await authFetchJson<EnrollmentResponse>('/api/v1/academic/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: input.programId,
      term_id: input.termId,
      campus_id: input.campusId,
    }),
  })
  return toEnrollment(body)
}

export async function fetchCourses(): Promise<Course[]> {
  const body = await authFetchJson<CourseResponse[]>('/api/v1/academic/courses')
  return body.map(toCourse)
}

export async function fetchCourseOfferings(): Promise<CourseOffering[]> {
  const body = await authFetchJson<CourseOfferingResponse[]>('/api/v1/academic/course-offerings')
  return body.map(toCourseOffering)
}

export async function fetchMyCourseRegistrations(): Promise<CourseRegistration[]> {
  const body = await authFetchJson<CourseRegistrationResponse[]>('/api/v1/academic/course-registrations')
  return body.map(toCourseRegistration)
}

export async function registerForCourse(input: {
  courseOfferingId: string
  enrollmentId: string
}): Promise<CourseRegistration> {
  const body = await authFetchJson<CourseRegistrationResponse>('/api/v1/academic/course-registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_offering_id: input.courseOfferingId, enrollment_id: input.enrollmentId }),
  })
  return toCourseRegistration(body)
}

export async function fetchAssessments(courseOfferingId: string): Promise<Assessment[]> {
  const body = await authFetchJson<AssessmentResponse[]>(
    `/api/v1/academic/assessments?course_offering_id=${encodeURIComponent(courseOfferingId)}`,
  )
  return body.map(toAssessment)
}

export async function fetchGrades(assessmentId: string): Promise<Grade[]> {
  const body = await authFetchJson<GradeResponse[]>(`/api/v1/academic/assessments/${assessmentId}/grades`)
  return body.map(toGrade)
}

export async function submitGradeAppeal(gradeId: string, reason: string): Promise<GradeAppeal> {
  const body = await authFetchJson<GradeAppealResponse>(`/api/v1/academic/grades/${gradeId}/appeals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  return toGradeAppeal(body)
}

export async function fetchMyAtRiskStatus(): Promise<AtRiskStatus[]> {
  const body = await authFetchJson<AtRiskStatusResponse[]>('/api/v1/academic/me/at-risk')
  return body.map(toAtRiskStatus)
}

async function downloadPdf(path: string, filename: string): Promise<void> {
  const response = await authFetch(path)
  if (!response.ok) {
    throw new Error(`Could not generate ${filename}`)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadTranscript(): Promise<void> {
  return downloadPdf('/api/v1/academic/reports/transcript', 'transcript.pdf')
}

export function downloadAttendanceSummary(): Promise<void> {
  return downloadPdf('/api/v1/academic/reports/attendance-summary', 'attendance-summary.pdf')
}

