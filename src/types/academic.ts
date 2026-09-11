export type Program = {
  id: string
  name: string
  code: string
}

export type Term = {
  id: string
  name: string
  startsOn: string
  endsOn: string
}

export type Enrollment = {
  id: string
  programId: string
  termId: string
  campusId: string
  studentId: string
  status: string
  createdAt: string
}
