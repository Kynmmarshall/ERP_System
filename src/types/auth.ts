export type Role =
  | 'super_admin'
  | 'admin'
  | 'lecturer'
  | 'finance_staff'
  | 'marketing'
  | 'student'

export type Principal = {
  id: string
  email: string
  fullName: string
  role: Role
  institutionId: string | null
}
