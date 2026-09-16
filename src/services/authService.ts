import { authFetch, authFetchJson } from '@/services/apiClient'
import { setAccessToken } from '@/services/tokenStore'
import type { Principal, Role } from '@/types/auth'

type AccessTokenResponse = {
  access_token: string
  token_type: string
  expires_in_seconds: number
  mfa_required?: boolean
}

type MfaChallengeResponse = {
  mfa_required: true
  challenge_id: string
  expires_in_seconds: number
}

/** Admin/super_admin logins complete in two steps, so login() resolves to
 * either a finished session or a pending challenge - never a token the
 * caller has to guess the meaning of. */
export type LoginResult =
  | { status: 'authenticated'; principal: Principal }
  | { status: 'mfa_required'; challengeId: string; expiresInSeconds: number }

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

export async function login(email: string, password: string): Promise<LoginResult> {
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

  if (body && typeof body === 'object' && (body as MfaChallengeResponse).mfa_required === true) {
    const challenge = body as MfaChallengeResponse
    return {
      status: 'mfa_required',
      challengeId: challenge.challenge_id,
      expiresInSeconds: challenge.expires_in_seconds,
    }
  }

  const token = body as AccessTokenResponse
  setAccessToken(token.access_token)
  return { status: 'authenticated', principal: await fetchMe() }
}

export async function verifyMfa(challengeId: string, code: string): Promise<Principal> {
  const response = await fetch('/api/v1/auth/mfa/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: challengeId, code }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'detail' in body
        ? String(body.detail)
        : 'Invalid or expired code'
    throw new Error(message)
  }
  const token = body as AccessTokenResponse
  setAccessToken(token.access_token)
  return fetchMe()
}

export async function register(input: {
  email: string
  password: string
  fullName: string
  requestedRole?: Role
  justification?: string
}): Promise<Principal> {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      full_name: input.fullName,
      requested_role: input.requestedRole ?? null,
      justification: input.justification ?? '',
    }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'detail' in body ? String(body.detail) : 'Registration failed'
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
