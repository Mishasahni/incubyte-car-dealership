import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { useAuth } from './AuthContext'

/**
 * Admin pages need an admin session; anyone else is sent to the storefront. This only decides
 * what the browser shows: the backend still checks the role on every admin request.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return isAdmin ? children : <Navigate to="/" replace />
}
