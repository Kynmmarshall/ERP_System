import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { registerSessionExpiredHandler, refreshAccessToken } from '@/services/apiClient'
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  verifyMfa as verifyMfaRequest,
  type LoginResult,
} from '@/services/authService'
import type { Principal, Role } from '@/types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  principal: Principal | null
  login: (email: string, password: string) => Promise<LoginResult>
  verifyMfa: (challengeId: string, code: string) => Promise<void>
  register: (input: {
    email: string
    password: string
    fullName: string
    requestedRole?: Role
    justification?: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [principal, setPrincipal] = useState<Principal | null>(null)

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setPrincipal(null)
      setStatus('unauthenticated')
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const refreshed = await refreshAccessToken()
      if (cancelled) return
      if (!refreshed) {
        setStatus('unauthenticated')
        return
      }
      try {
        const me = await fetchMe()
        if (!cancelled) {
          setPrincipal(me)
          setStatus('authenticated')
        }
      } catch {
        if (!cancelled) setStatus('unauthenticated')
      }
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password)
    // A pending MFA challenge is NOT a session - state stays unauthenticated
    // until the second factor actually succeeds.
    if (result.status === 'authenticated') {
      setPrincipal(result.principal)
      setStatus('authenticated')
    }
    return result
  }, [])

  const verifyMfa = useCallback(async (challengeId: string, code: string) => {
    const me = await verifyMfaRequest(challengeId, code)
    setPrincipal(me)
    setStatus('authenticated')
  }, [])

  const register = useCallback(
    async (input: {
      email: string
      password: string
      fullName: string
      requestedRole?: Role
      justification?: string
    }) => {
      const me = await registerRequest(input)
      setPrincipal(me)
      setStatus('authenticated')
    },
    [],
  )

  const logout = useCallback(async () => {
    await logoutRequest()
    setPrincipal(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, principal, login, verifyMfa, register, logout }),
    [status, principal, login, verifyMfa, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
