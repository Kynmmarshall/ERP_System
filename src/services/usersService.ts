import { authFetchJson } from '@/services/apiClient'
import type { Role } from '@/types/auth'

type UserSummaryResponse = {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
  campus_id: string | null
  created_at: string
}

export type ManagedUser = {
  id: string
  email: string
  fullName: string
  role: Role
  isActive: boolean
  createdAt: string
}

function toManagedUser(body: UserSummaryResponse): ManagedUser {
  return {
    id: body.id,
    email: body.email,
    fullName: body.full_name,
    role: body.role,
    isActive: body.is_active,
    createdAt: body.created_at,
  }
}

export async function fetchUsers(): Promise<ManagedUser[]> {
  const body = await authFetchJson<UserSummaryResponse[]>('/api/v1/auth/users')
  return body.map(toManagedUser)
}

export async function updateUserRole(userId: string, role: Role): Promise<ManagedUser> {
  const body = await authFetchJson<UserSummaryResponse>(
    `/api/v1/auth/users/${encodeURIComponent(userId)}/role`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    },
  )
  return toManagedUser(body)
}

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected'

export type RoleRequest = {
  id: string
  userId: string
  requestedRole: Role
  status: RoleRequestStatus
  justification: string
  decidedAt: string | null
  createdAt: string
}

type RoleRequestResponse = {
  id: string
  user_id: string
  requested_role: Role
  status: RoleRequestStatus
  justification: string
  decided_at: string | null
  created_at: string
}

export async function fetchRoleRequests(): Promise<RoleRequest[]> {
  const body = await authFetchJson<RoleRequestResponse[]>('/api/v1/auth/role-requests')
  return body.map((item) => ({
    id: item.id,
    userId: item.user_id,
    requestedRole: item.requested_role,
    status: item.status,
    justification: item.justification,
    decidedAt: item.decided_at,
    createdAt: item.created_at,
  }))
}

export async function decideRoleRequest(requestId: string, approve: boolean): Promise<void> {
  await authFetchJson<RoleRequestResponse>(
    `/api/v1/auth/role-requests/${encodeURIComponent(requestId)}/decision`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    },
  )
}
