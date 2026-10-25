import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { User } from '../api/auth'
import { AppRoutes } from '../App'
import { AuthProvider } from '../auth/AuthContext'
import { saveSession } from '../auth/session'

export const BUYER: User = { id: 1, email: 'buyer@dealership.com', role: 'user' }
export const ADMIN: User = { id: 2, email: 'admin@dealership.com', role: 'admin' }

/** Render the whole app at ``path``, as the browser would after navigating there. */
export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/** Start the test already logged in as ``user``. */
export function signInAs(user: User) {
  saveSession({ token: 'test-token', user })
}
