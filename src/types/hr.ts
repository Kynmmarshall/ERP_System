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
