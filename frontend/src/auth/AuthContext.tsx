import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import * as authApi from '../api/auth'
import type { DemoRole, LoginResponse, User } from '../api/auth'
import { onUnauthorized } from '../api/client'
import { clearSession, loadSession, saveSession, type Session } from './session'

interface AuthValue {
  user: User | null
  isAdmin: boolean
  /** Shown on the sign-in page after an expired session. */
  notice: string | null
  signIn: (email: string, password: string) => Promise<void>
  /** Sign in the server's dedicated demo account for a role, when demo access is on. */
  signInAsDemo: (role: DemoRole) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [notice, setNotice] = useState<string | null>(null)

  const startSession = useCallback((response: LoginResponse) => {
    const next = { token: response.access_token, user: response.user }
    saveSession(next)
    setNotice(null)
    setSession(next)
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => startSession(await authApi.login(email, password)),
    [startSession],
  )

  const signInAsDemo = useCallback(
    async (role: DemoRole) => startSession(await authApi.demoLogin(role)),
    [startSession],
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      await authApi.register(email, password)
      await signIn(email, password)
    },
    [signIn],
  )

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  useEffect(() => {
    onUnauthorized(() => {
      clearSession()
      setSession(null)
      setNotice('Your session has expired. Please sign in again.')
    })
    return () => onUnauthorized(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      isAdmin: session?.user.role === 'admin',
      notice,
      signIn,
      signInAsDemo,
      signUp,
      signOut,
    }),
    [session, notice, signIn, signInAsDemo, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
