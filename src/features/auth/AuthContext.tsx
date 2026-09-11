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
import { fetchMe, login as loginRequest, logout as logoutRequest } from '@/services/authService'
import type { Principal } from '@/types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  principal: Principal | null
  login: (email: string, password: string) => Promise<void>
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
    const me = await loginRequest(email, password)
    setPrincipal(me)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setPrincipal(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, principal, login, logout }),
    [status, principal, login, logout],
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
