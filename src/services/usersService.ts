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
