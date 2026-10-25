import { request } from './client'

export interface Vehicle {
  id: number
  make: string
  model: string
  category: string
  price: number
  quantity: number
}

export type VehicleInput = Omit<Vehicle, 'id'>

/** Only the filters the user filled in; values are sent as typed. */
export interface SearchFilters {
  make?: string
  model?: string
  category?: string
  min_price?: string
  max_price?: string
}

export function listVehicles(): Promise<Vehicle[]> {
  return request<Vehicle[]>('/api/vehicles')
}

export function searchVehicles(filters: SearchFilters): Promise<Vehicle[]> {
  const query = new URLSearchParams(filters as Record<string, string>)
  return request<Vehicle[]>(`/api/vehicles/search?${query}`)
}

export function purchaseVehicle(id: number): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}/purchase`, { method: 'POST' })
}

export function createVehicle(input: VehicleInput): Promise<Vehicle> {
  return request<Vehicle>('/api/vehicles', { method: 'POST', body: input })
}

export function updateVehicle(id: number, input: VehicleInput): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: input })
}

export function deleteVehicle(id: number): Promise<void> {
  return request<void>(`/api/vehicles/${id}`, { method: 'DELETE' })
}

export function restockVehicle(id: number, quantity: number): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}/restock`, { method: 'POST', body: { quantity } })
}
