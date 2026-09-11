import { authFetchJson } from '@/services/apiClient'
import type { AttendanceRecord, LeaveRequest, LeaveStatus, Notification, Payslip } from '@/types/hr'

type LeaveRequestResponse = {
  id: string
  starts_on: string
  ends_on: string
  reason: string
  status: LeaveStatus
  created_at: string
}

type NotificationResponse = {
  id: string
  message: string
  created_at: string
  read_at: string | null
}

type AttendanceRecordResponse = {
  id: string
  shift_id: string
  checked_in_at: string
}

type PayslipResponse = {
  id: string
  period: string
  gross_xaf: number
  cnps_employee_xaf: number
  taxable_base_xaf: number
  irpp_xaf: number
  net_xaf: number
}

function toLeaveRequest(body: LeaveRequestResponse): LeaveRequest {
  return {
    id: body.id,
    startsOn: body.starts_on,
    endsOn: body.ends_on,
    reason: body.reason,
    status: body.status,
    createdAt: body.created_at,
  }
}

function toNotification(body: NotificationResponse): Notification {
  return {
    id: body.id,
    message: body.message,
    createdAt: body.created_at,
    readAt: body.read_at,
  }
}

function toAttendanceRecord(body: AttendanceRecordResponse): AttendanceRecord {
  return {
    id: body.id,
    shiftId: body.shift_id,
    checkedInAt: body.checked_in_at,
  }
}

function toPayslip(body: PayslipResponse): Payslip {
  return {
    id: body.id,
    period: body.period,
    grossXaf: body.gross_xaf,
    cnpsEmployeeXaf: body.cnps_employee_xaf,
    taxableBaseXaf: body.taxable_base_xaf,
    irppXaf: body.irpp_xaf,
    netXaf: body.net_xaf,
  }
}

export async function fetchMyLeaveRequests(): Promise<LeaveRequest[]> {
  const body = await authFetchJson<LeaveRequestResponse[]>('/api/v1/hr/leave/requests/mine')
  return body.map(toLeaveRequest)
}

export async function submitLeaveRequest(input: {
  startsOn: string
  endsOn: string
  reason: string
}): Promise<LeaveRequest> {
  const body = await authFetchJson<LeaveRequestResponse>('/api/v1/hr/leave/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ starts_on: input.startsOn, ends_on: input.endsOn, reason: input.reason }),
  })
  return toLeaveRequest(body)
}

export async function fetchMyNotifications(): Promise<Notification[]> {
  const body = await authFetchJson<NotificationResponse[]>('/api/v1/hr/notifications/mine')
  return body.map(toNotification)
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const body = await authFetchJson<NotificationResponse>(
    `/api/v1/hr/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: 'POST' },
  )
  return toNotification(body)
}

export async function checkIn(token: string): Promise<AttendanceRecord> {
  const body = await authFetchJson<AttendanceRecordResponse>('/api/v1/hr/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return toAttendanceRecord(body)
}

export async function fetchMyAttendance(): Promise<AttendanceRecord[]> {
  const body = await authFetchJson<AttendanceRecordResponse[]>('/api/v1/hr/attendance/mine')
  return body.map(toAttendanceRecord)
}

export async function fetchMyPayslips(): Promise<Payslip[]> {
  const body = await authFetchJson<PayslipResponse[]>('/api/v1/hr/payroll/payslips/mine')
  return body.map(toPayslip)
}
