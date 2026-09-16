import { authFetch, authFetchJson } from '@/services/apiClient'
import type {
  Assessment,
  AtRiskStatus,
  AttendanceRecord,
  AttendanceSession,
  Course,
  CourseOffering,
  CourseRegistration,
  Enrollment,
  ExamSchedule,
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
}): Promise<Enrollment> {
  const body = await authFetchJson<EnrollmentResponse>('/api/v1/academic/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: input.programId,
      term_id: input.termId,
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

// --- Staff / instructor operations -----------------------------------------
// Every endpoint below is role-gated server-side (admin/lecturer, and
// for offering-scoped work the caller must be that offering's instructor).

type AttendanceSessionResponse = { id: string; course_offering_id: string; session_date: string }
type AttendanceRecordResponse = {
  id: string
  attendance_session_id: string
  student_id: string
  present: boolean
}
type ExamScheduleResponse = {
  id: string
  course_offering_id: string
  room: string
  starts_at: string
  ends_at: string
}

function toAttendanceSession(body: AttendanceSessionResponse): AttendanceSession {
  return { id: body.id, courseOfferingId: body.course_offering_id, sessionDate: body.session_date }
}

function toAttendanceRecord(body: AttendanceRecordResponse): AttendanceRecord {
  return {
    id: body.id,
    attendanceSessionId: body.attendance_session_id,
    studentId: body.student_id,
    present: body.present,
  }
}

function toExamSchedule(body: ExamScheduleResponse): ExamSchedule {
  return {
    id: body.id,
    courseOfferingId: body.course_offering_id,
    room: body.room,
    startsAt: body.starts_at,
    endsAt: body.ends_at,
  }
}

export async function createCourse(input: {
  programId: string
  code: string
  name: string
  credits: number
}): Promise<Course> {
  const body = await authFetchJson<CourseResponse>('/api/v1/academic/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: input.programId,
      code: input.code,
      name: input.name,
      credits: input.credits,
    }),
  })
  return toCourse(body)
}

export async function createCourseOffering(input: {
  courseId: string
  termId: string
  instructorId: string
  room: string
  capacity: number
}): Promise<CourseOffering> {
  const body = await authFetchJson<CourseOfferingResponse>('/api/v1/academic/course-offerings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_id: input.courseId,
      term_id: input.termId,
      instructor_id: input.instructorId,
      room: input.room,
      capacity: input.capacity,
    }),
  })
  return toCourseOffering(body)
}

export async function fetchCourseRoster(courseOfferingId: string): Promise<CourseRegistration[]> {
  const body = await authFetchJson<CourseRegistrationResponse[]>(
    `/api/v1/academic/course-registrations?course_offering_id=${encodeURIComponent(courseOfferingId)}`,
  )
  return body.map(toCourseRegistration)
}

export async function createAssessment(input: {
  courseOfferingId: string
  name: string
  maxScore: number
}): Promise<Assessment> {
  const body = await authFetchJson<AssessmentResponse>('/api/v1/academic/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_offering_id: input.courseOfferingId,
      name: input.name,
      max_score: input.maxScore,
    }),
  })
  return toAssessment(body)
}

export async function enterGrades(
  assessmentId: string,
  grades: { studentId: string; score: number }[],
): Promise<Grade[]> {
  const body = await authFetchJson<GradeResponse[]>(
    `/api/v1/academic/assessments/${encodeURIComponent(assessmentId)}/grades`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grades: grades.map((g) => ({ student_id: g.studentId, score: g.score })),
      }),
    },
  )
  return body.map(toGrade)
}

export async function publishGrades(assessmentId: string): Promise<Grade[]> {
  const body = await authFetchJson<GradeResponse[]>(
    `/api/v1/academic/assessments/${encodeURIComponent(assessmentId)}/publish`,
    { method: 'POST' },
  )
  return body.map(toGrade)
}

export async function fetchAppealsForGrade(gradeId: string): Promise<GradeAppeal[]> {
  const body = await authFetchJson<GradeAppealResponse[]>(
    `/api/v1/academic/grades/${encodeURIComponent(gradeId)}/appeals`,
  )
  return body.map(toGradeAppeal)
}

export async function decideAppeal(
  appealId: string,
  input: { status: 'accepted' | 'rejected'; reviewerNotes?: string; correctedScore?: number },
): Promise<GradeAppeal> {
  const body = await authFetchJson<GradeAppealResponse>(
    `/api/v1/academic/appeals/${encodeURIComponent(appealId)}/decision`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: input.status,
        reviewer_notes: input.reviewerNotes ?? null,
        corrected_score: input.correctedScore ?? null,
      }),
    },
  )
  return toGradeAppeal(body)
}

export async function fetchAttendanceSessions(courseOfferingId: string): Promise<AttendanceSession[]> {
  const body = await authFetchJson<AttendanceSessionResponse[]>(
    `/api/v1/academic/attendance-sessions?course_offering_id=${encodeURIComponent(courseOfferingId)}`,
  )
  return body.map(toAttendanceSession)
}

export async function createAttendanceSession(input: {
  courseOfferingId: string
  sessionDate: string
}): Promise<AttendanceSession> {
  const body = await authFetchJson<AttendanceSessionResponse>('/api/v1/academic/attendance-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_offering_id: input.courseOfferingId,
      session_date: input.sessionDate,
    }),
  })
  return toAttendanceSession(body)
}

export async function fetchAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
  const body = await authFetchJson<AttendanceRecordResponse[]>(
    `/api/v1/academic/attendance-sessions/${encodeURIComponent(sessionId)}/records`,
  )
  return body.map(toAttendanceRecord)
}

export async function markAttendance(
  sessionId: string,
  records: { studentId: string; present: boolean }[],
): Promise<AttendanceRecord[]> {
  const body = await authFetchJson<AttendanceRecordResponse[]>(
    `/api/v1/academic/attendance-sessions/${encodeURIComponent(sessionId)}/records`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: records.map((r) => ({ student_id: r.studentId, present: r.present })),
      }),
    },
  )
  return body.map(toAttendanceRecord)
}

export async function fetchExamSchedules(termId: string): Promise<ExamSchedule[]> {
  const body = await authFetchJson<ExamScheduleResponse[]>(
    `/api/v1/academic/exam-schedules?term_id=${encodeURIComponent(termId)}`,
  )
  return body.map(toExamSchedule)
}

export async function createExamSchedule(input: {
  courseOfferingId: string
  room: string
  startsAt: string
  endsAt: string
}): Promise<ExamSchedule> {
  const body = await authFetchJson<ExamScheduleResponse>('/api/v1/academic/exam-schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_offering_id: input.courseOfferingId,
      room: input.room,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    }),
  })
  return toExamSchedule(body)
}

export async function fetchOfferingAtRisk(courseOfferingId: string): Promise<AtRiskStatus[]> {
  const body = await authFetchJson<AtRiskStatusResponse[]>(
    `/api/v1/academic/course-offerings/${encodeURIComponent(courseOfferingId)}/at-risk`,
  )
  return body.map(toAtRiskStatus)
}

