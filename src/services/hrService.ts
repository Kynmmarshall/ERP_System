import { authFetchJson } from '@/services/apiClient'
import type {
  AdminLeaveRequest,
  Asset,
  AssetMovement,
  AttendanceRecord,
  Candidate,
  CandidateStage,
  Employee,
  LeaveRequest,
  LeaveStatus,
  Notification,
  PayrollRun,
  PayrollRunStatus,
  PayrollSchedule,
  Payslip,
  PerformanceReview,
  Position,
  RunPayslip,
  Shift,
  ShiftQrToken,
} from '@/types/hr'

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

// --- Admin ---

type EmployeeResponse = {
  id: string
  full_name: string
  email: string
  department: string
  hire_date: string
  gross_monthly_salary_xaf: number
  status: string
}

type PositionResponse = {
  id: string
  title: string
  department: string
  status: string
  created_at: string
}

type CandidateResponse = {
  id: string
  position_id: string
  full_name: string
  email: string
  stage: CandidateStage
  created_at: string
}

type AdminLeaveRequestResponse = LeaveRequestResponse & {
  employee_id: string
  decided_at: string | null
}

type ShiftResponse = {
  id: string
  employee_id: string
  starts_at: string
  ends_at: string
}

type PerformanceReviewResponse = {
  id: string
  employee_id: string
  period: string
  rating: number
  comments: string
  created_at: string
}

type AssetResponse = {
  id: string
  name: string
  category: string
  total_quantity: number
  created_at: string
}

type AssetMovementResponse = {
  id: string
  asset_id: string
  employee_id: string | null
  quantity_delta: number
  reason: string
  created_at: string
}

type PayrollScheduleResponse = {
  id: string
  effective_from: string
  is_verified: boolean
  created_by: string | null
  verified_by: string | null
  cnps_employee_rate: string
  cnps_employer_rate: string
  cnps_ceiling_xaf: number
  standard_deduction_rate: string
  created_at: string
}

type PayrollRunResponse = {
  id: string
  period: string
  schedule_version_id: string
  status: PayrollRunStatus
  approved_at: string | null
  created_at: string
}

type RunPayslipResponse = PayslipResponse & {
  employee_id: string
  cnps_employer_xaf: number
}

export async function fetchEmployees(): Promise<Employee[]> {
  const body = await authFetchJson<EmployeeResponse[]>('/api/v1/hr/employees')
  return body.map((item) => ({
    id: item.id,
    fullName: item.full_name,
    email: item.email,
    department: item.department,
    hireDate: item.hire_date,
    grossMonthlySalaryXaf: item.gross_monthly_salary_xaf,
    status: item.status,
  }))
}

export async function fetchPositions(): Promise<Position[]> {
  const body = await authFetchJson<PositionResponse[]>('/api/v1/hr/positions')
  return body.map((item) => ({
    id: item.id,
    title: item.title,
    department: item.department,
    status: item.status,
    createdAt: item.created_at,
  }))
}

export async function createPosition(input: { title: string; department: string }): Promise<void> {
  await authFetchJson<PositionResponse>('/api/v1/hr/positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: input.title, department: input.department }),
  })
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const body = await authFetchJson<CandidateResponse[]>('/api/v1/hr/candidates')
  return body.map((item) => ({
    id: item.id,
    positionId: item.position_id,
    fullName: item.full_name,
    email: item.email,
    stage: item.stage,
    createdAt: item.created_at,
  }))
}

export async function createCandidate(input: {
  positionId: string
  fullName: string
  email: string
}): Promise<void> {
  await authFetchJson<CandidateResponse>('/api/v1/hr/candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      position_id: input.positionId,
      full_name: input.fullName,
      email: input.email,
    }),
  })
}

export async function updateCandidateStage(candidateId: string, stage: CandidateStage): Promise<void> {
  await authFetchJson<CandidateResponse>(
    `/api/v1/hr/candidates/${encodeURIComponent(candidateId)}/stage`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    },
  )
}

export async function hireCandidate(
  candidateId: string,
  input: { department: string; grossMonthlySalaryXaf: number; hireDate: string },
): Promise<void> {
  await authFetchJson<EmployeeResponse>(
    `/api/v1/hr/candidates/${encodeURIComponent(candidateId)}/hire`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department: input.department,
        gross_monthly_salary_xaf: input.grossMonthlySalaryXaf,
        hire_date: input.hireDate,
      }),
    },
  )
}

export async function fetchLeaveRequests(): Promise<AdminLeaveRequest[]> {
  const body = await authFetchJson<AdminLeaveRequestResponse[]>('/api/v1/hr/leave/requests')
  return body.map((item) => ({
    id: item.id,
    employeeId: item.employee_id,
    startsOn: item.starts_on,
    endsOn: item.ends_on,
    reason: item.reason,
    status: item.status,
    decidedAt: item.decided_at,
    createdAt: item.created_at,
  }))
}

export async function decideLeaveRequest(requestId: string, approve: boolean): Promise<void> {
  await authFetchJson<AdminLeaveRequestResponse>(
    `/api/v1/hr/leave/requests/${encodeURIComponent(requestId)}/decision`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    },
  )
}

export async function fetchShifts(): Promise<Shift[]> {
  const body = await authFetchJson<ShiftResponse[]>('/api/v1/hr/attendance/shifts')
  return body.map((item) => ({
    id: item.id,
    employeeId: item.employee_id,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
  }))
}

export async function createShift(input: {
  employeeId: string
  startsAt: string
  endsAt: string
}): Promise<void> {
  await authFetchJson<ShiftResponse>('/api/v1/hr/attendance/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: input.employeeId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    }),
  })
}

export async function issueShiftQrToken(shiftId: string): Promise<ShiftQrToken> {
  const body = await authFetchJson<{ token: string; expires_at: string }>(
    `/api/v1/hr/attendance/shifts/${encodeURIComponent(shiftId)}/qr-token`,
    { method: 'POST' },
  )
  return { token: body.token, expiresAt: body.expires_at }
}

export async function fetchPerformanceReviews(): Promise<PerformanceReview[]> {
  const body = await authFetchJson<PerformanceReviewResponse[]>('/api/v1/hr/performance/reviews')
  return body.map((item) => ({
    id: item.id,
    employeeId: item.employee_id,
    period: item.period,
    rating: item.rating,
    comments: item.comments,
    createdAt: item.created_at,
  }))
}

export async function createPerformanceReview(input: {
  employeeId: string
  period: string
  rating: number
  comments: string
}): Promise<void> {
  await authFetchJson<PerformanceReviewResponse>('/api/v1/hr/performance/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: input.employeeId,
      period: input.period,
      rating: input.rating,
      comments: input.comments,
    }),
  })
}

export async function fetchAssets(): Promise<Asset[]> {
  const body = await authFetchJson<AssetResponse[]>('/api/v1/hr/assets')
  return body.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    totalQuantity: item.total_quantity,
    createdAt: item.created_at,
  }))
}

export async function createAsset(input: {
  name: string
  category: string
  totalQuantity: number
}): Promise<void> {
  await authFetchJson<AssetResponse>('/api/v1/hr/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      category: input.category,
      total_quantity: input.totalQuantity,
    }),
  })
}

export async function fetchAssetMovements(assetId: string): Promise<AssetMovement[]> {
  const body = await authFetchJson<AssetMovementResponse[]>(
    `/api/v1/hr/assets/${encodeURIComponent(assetId)}/movements`,
  )
  return body.map((item) => ({
    id: item.id,
    assetId: item.asset_id,
    employeeId: item.employee_id,
    quantityDelta: item.quantity_delta,
    reason: item.reason,
    createdAt: item.created_at,
  }))
}

export async function createAssetMovement(input: {
  assetId: string
  employeeId: string | null
  quantityDelta: number
  reason: string
}): Promise<void> {
  await authFetchJson<AssetMovementResponse>('/api/v1/hr/assets/movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset_id: input.assetId,
      employee_id: input.employeeId,
      quantity_delta: input.quantityDelta,
      reason: input.reason,
    }),
  })
}

export async function fetchPayrollSchedules(): Promise<PayrollSchedule[]> {
  const body = await authFetchJson<PayrollScheduleResponse[]>('/api/v1/hr/payroll/schedules')
  return body.map((item) => ({
    id: item.id,
    effectiveFrom: item.effective_from,
    isVerified: item.is_verified,
    createdBy: item.created_by,
    verifiedBy: item.verified_by,
    cnpsEmployeeRate: item.cnps_employee_rate,
    cnpsEmployerRate: item.cnps_employer_rate,
    cnpsCeilingXaf: item.cnps_ceiling_xaf,
    standardDeductionRate: item.standard_deduction_rate,
    createdAt: item.created_at,
  }))
}

export async function createPayrollSchedule(input: {
  effectiveFrom: string
  cnpsEmployeeRate: string
  cnpsEmployerRate: string
  cnpsCeilingXaf: number
  standardDeductionRate: string
  irppBrackets: { upToXaf: number | null; rate: string }[]
}): Promise<void> {
  await authFetchJson<PayrollScheduleResponse>('/api/v1/hr/payroll/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      effective_from: input.effectiveFrom,
      cnps_employee_rate: input.cnpsEmployeeRate,
      cnps_employer_rate: input.cnpsEmployerRate,
      cnps_ceiling_xaf: input.cnpsCeilingXaf,
      standard_deduction_rate: input.standardDeductionRate,
      irpp_brackets: input.irppBrackets.map((bracket) => ({
        up_to_xaf: bracket.upToXaf,
        rate: bracket.rate,
      })),
    }),
  })
}

export async function verifyPayrollSchedule(scheduleId: string): Promise<void> {
  await authFetchJson<PayrollScheduleResponse>(
    `/api/v1/hr/payroll/schedules/${encodeURIComponent(scheduleId)}/verify`,
    { method: 'PATCH' },
  )
}

export async function fetchPayrollRuns(): Promise<PayrollRun[]> {
  const body = await authFetchJson<PayrollRunResponse[]>('/api/v1/hr/payroll/runs')
  return body.map((item) => ({
    id: item.id,
    period: item.period,
    scheduleVersionId: item.schedule_version_id,
    status: item.status,
    approvedAt: item.approved_at,
    createdAt: item.created_at,
  }))
}

export async function createPayrollRun(input: {
  period: string
  scheduleVersionId: string
}): Promise<void> {
  await authFetchJson<PayrollRunResponse>('/api/v1/hr/payroll/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period: input.period, schedule_version_id: input.scheduleVersionId }),
  })
}

export async function approvePayrollRun(runId: string): Promise<void> {
  await authFetchJson<PayrollRunResponse>(
    `/api/v1/hr/payroll/runs/${encodeURIComponent(runId)}/approve`,
    { method: 'POST' },
  )
}

export async function fetchRunPayslips(runId: string): Promise<RunPayslip[]> {
  const body = await authFetchJson<RunPayslipResponse[]>(
    `/api/v1/hr/payroll/runs/${encodeURIComponent(runId)}/payslips`,
  )
  return body.map((item) => ({
    ...toPayslip(item),
    employeeId: item.employee_id,
    cnpsEmployerXaf: item.cnps_employer_xaf,
  }))
}
