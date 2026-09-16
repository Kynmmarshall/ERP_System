export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export type LeaveRequest = {
  id: string
  startsOn: string
  endsOn: string
  reason: string
  status: LeaveStatus
  createdAt: string
}

export type Notification = {
  id: string
  message: string
  createdAt: string
  readAt: string | null
}

export type AttendanceRecord = {
  id: string
  shiftId: string
  checkedInAt: string
}

export type Payslip = {
  id: string
  period: string
  grossXaf: number
  cnpsEmployeeXaf: number
  taxableBaseXaf: number
  irppXaf: number
  netXaf: number
}

export type Employee = {
  id: string
  fullName: string
  email: string
  department: string
  hireDate: string
  grossMonthlySalaryXaf: number
  status: string
}

export type Position = {
  id: string
  title: string
  department: string
  status: string
  createdAt: string
}

export type CandidateStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export type Candidate = {
  id: string
  positionId: string
  fullName: string
  email: string
  stage: CandidateStage
  createdAt: string
}

export type AdminLeaveRequest = {
  id: string
  employeeId: string
  startsOn: string
  endsOn: string
  reason: string
  status: LeaveStatus
  decidedAt: string | null
  createdAt: string
}

export type Shift = {
  id: string
  employeeId: string
  startsAt: string
  endsAt: string
}

export type ShiftQrToken = {
  token: string
  expiresAt: string
}

export type PerformanceReview = {
  id: string
  employeeId: string
  period: string
  rating: number
  comments: string
  createdAt: string
}

export type Asset = {
  id: string
  name: string
  category: string
  totalQuantity: number
  createdAt: string
}

export type AssetMovement = {
  id: string
  assetId: string
  employeeId: string | null
  quantityDelta: number
  reason: string
  createdAt: string
}

export type PayrollSchedule = {
  id: string
  effectiveFrom: string
  isVerified: boolean
  cnpsEmployeeRate: string
  cnpsEmployerRate: string
  cnpsCeilingXaf: number
  standardDeductionRate: string
  createdAt: string
}

export type PayrollRunStatus = 'draft' | 'approved'

export type PayrollRun = {
  id: string
  period: string
  scheduleVersionId: string
  status: PayrollRunStatus
  approvedAt: string | null
  createdAt: string
}

export type RunPayslip = Payslip & {
  employeeId: string
  cnpsEmployerXaf: number
}
