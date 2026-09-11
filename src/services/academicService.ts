import { authFetchJson } from '@/services/apiClient'
import type { Enrollment, Program, Term } from '@/types/academic'

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
