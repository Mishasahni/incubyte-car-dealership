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
