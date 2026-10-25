import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import * as authApi from '../api/auth'
import type { User } from '../api/auth'
import { onUnauthorized } from '../api/client'
import { clearSession, loadSession, saveSession, type Session } from './session'

interface AuthValue {
  user: User | null
  isAdmin: boolean
  /** Shown on the sign-in page after an expired session. */
  notice: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [notice, setNotice] = useState<string | null>(null)

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    const next = { token: response.access_token, user: response.user }
    saveSession(next)
    setNotice(null)
    setSession(next)
  }, [])

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
      signUp,
      signOut,
    }),
    [session, notice, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
