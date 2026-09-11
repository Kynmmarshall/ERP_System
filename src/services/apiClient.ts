import { getAccessToken, setAccessToken } from '@/services/tokenStore'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type SessionExpiredHandler = () => void
let onSessionExpired: SessionExpiredHandler | null = null

/** Registered once by AuthProvider so authFetch can clear auth state on an
 * unrecoverable 401, without importing React context here. */
export function registerSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })
        if (!response.ok) {
          setAccessToken(null)
          return false
        }
        const body = (await response.json()) as { access_token: string }
        setAccessToken(body.access_token)
        return true
      } catch {
        setAccessToken(null)
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Same-origin fetch (through the gateway) that attaches the access token,
 * transparently refreshes it once on a 401, and retries the original
 * request exactly once before giving up.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const attempt = async (): Promise<Response> => {
    const token = getAccessToken()
    const headers = new Headers(init.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return fetch(input, { ...init, headers, credentials: 'include' })
  }

  let response = await attempt()

  if (response.status === 401 && input !== '/api/v1/auth/refresh') {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await attempt()
    } else {
      onSessionExpired?.()
      return response
    }
    if (response.status === 401) {
      onSessionExpired?.()
    }
  }

  return response
}

export async function authFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(input, init)
  const body = await parseBody(response)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`
    throw new ApiError(response.status, message, body)
  }
  return body as T
}

export { refreshAccessToken }
