import { request } from './client'

export type Role = 'user' | 'admin'

export interface User {
  id: number
  email: string
  role: Role
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export function register(email: string, password: string): Promise<User> {
  return request<User>('/api/auth/register', { method: 'POST', body: { email, password } })
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', { method: 'POST', body: { email, password } })
}

export type DemoRole = 'buyer' | 'admin'

export interface DemoStatus {
  enabled: boolean
  roles: DemoRole[]
}

/** Whether the server offers demo sign-in, and for which roles. Never includes credentials. */
export function getDemoStatus(): Promise<DemoStatus> {
  return request<DemoStatus>('/api/auth/demo')
}

/** The server signs in its dedicated demo account for ``role``; no password is sent. */
export function demoLogin(role: DemoRole): Promise<LoginResponse> {
  return request<LoginResponse>(`/api/auth/demo/${role}`, { method: 'POST' })
}
