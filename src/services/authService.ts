import { authFetch, authFetchJson } from '@/services/apiClient'
import { setAccessToken } from '@/services/tokenStore'
import type { Principal, Role } from '@/types/auth'

type AccessTokenResponse = {
  access_token: string
  token_type: string
  expires_in_seconds: number
}

type MeResponse = {
  id: string
  email: string
  full_name: string
  role: Role
  institution_id: string | null
  campus_id: string | null
}

function toPrincipal(body: MeResponse): Principal {
  return {
    id: body.id,
    email: body.email,
    fullName: body.full_name,
    role: body.role,
    institutionId: body.institution_id,
    campusId: body.campus_id,
  }
}

export async function login(email: string, password: string): Promise<Principal> {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'detail' in body ? String(body.detail) : 'Login failed'
    throw new Error(message)
  }
  const token = body as AccessTokenResponse
  setAccessToken(token.access_token)
  return fetchMe()
}

export async function fetchMe(): Promise<Principal> {
  const body = await authFetchJson<MeResponse>('/api/v1/auth/me')
  return toPrincipal(body)
}

export async function logout(): Promise<void> {
  try {
    await authFetch('/api/v1/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
  }
}
