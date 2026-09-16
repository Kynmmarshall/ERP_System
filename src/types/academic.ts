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

export type Course = {
  id: string
  programId: string
  code: string
  name: string
  credits: number
}

export type CourseOffering = {
  id: string
  courseId: string
  termId: string
  instructorId: string
  room: string
  capacity: number
}

export type CourseRegistration = {
  id: string
  studentId: string
  enrollmentId: string
  courseOfferingId: string
  createdAt: string
}

export type Assessment = {
  id: string
  courseOfferingId: string
  name: string
  maxScore: number
}

export type Grade = {
  id: string
  assessmentId: string
  studentId: string
  score: number
  published: boolean
}

export type GradeAppeal = {
  id: string
  gradeId: string
  studentId: string
  reason: string
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected'
  reviewerNotes: string | null
  decidedBy: string | null
  decidedAt: string | null
}

export type AtRiskStatus = {
  studentId: string
  courseOfferingId: string
  attendanceRate: number | null
  assessmentAverage: number | null
  atRisk: boolean
}

export type AttendanceSession = {
  id: string
  courseOfferingId: string
  sessionDate: string
}

export type AttendanceRecord = {
  id: string
  attendanceSessionId: string
  studentId: string
  present: boolean
}

export type ExamSchedule = {
  id: string
  courseOfferingId: string
  room: string
  startsAt: string
  endsAt: string
}

export type Prerequisite = {
  id: string
  courseId: string
  prerequisiteCourseId: string
}
