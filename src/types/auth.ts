export type Role = 'super_admin' | 'admin' | 'staff' | 'student'

export type Principal = {
  id: string
  email: string
  fullName: string
  role: Role
  institutionId: string | null
  campusId: string | null
}
