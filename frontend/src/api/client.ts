import { loadSession } from '../auth/session'

/** Backend base URL; override with VITE_API_URL in frontend/.env. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** An HTTP error from the API, carrying the status and the server's message. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let handleUnauthorized: (() => void) | null = null

/** Register what to do when a signed-in request is rejected with 401 (session expired). */
export function onUnauthorized(handler: (() => void) | null) {
  handleUnauthorized = handler
}

type RequestOptions = { method?: string; body?: unknown }

export async function request<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = loadSession()?.token
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && token) handleUnauthorized?.()
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response))
  return (response.status === 204 ? undefined : await response.json()) as T
}

/** FastAPI sends {"detail": "..."} or, for validation errors, a list of problems. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const { detail } = await response.json()
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  } catch {
    // Not JSON: fall through to a generic message.
  }
  return `Request failed (${response.status})`
}
