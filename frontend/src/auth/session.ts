import type { User } from '../api/auth'

export interface Session {
  token: string
  user: User
}

const STORAGE_KEY = 'dealership.session'

/** The stored session, or null. localStorage is a documented trade-off (see README). */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}
