import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { useAuth } from './AuthContext'

/** Every vehicle endpoint needs a token, so signed-out visitors go to the sign-in page. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}
