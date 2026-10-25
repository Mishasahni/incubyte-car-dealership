import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '../api/client'
import { listVehicles, purchaseVehicle, searchVehicles, type SearchFilters, type Vehicle } from '../api/vehicles'

export type Feedback = { tone: 'success' | 'error'; text: string } | null
type Status = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready' }

export const nameOf = (vehicle: Vehicle) => `${vehicle.make} ${vehicle.model}`

export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
}

/**
 * The inventory data both experiences share: the full list (for counts and category options),
 * the current search results, purchasing, and local updates after a change succeeds.
 */
export function useInventory() {
  const [all, setAll] = useState<Vehicle[]>([])
  const [results, setResults] = useState<Vehicle[] | null>(null)
  const [filters, setFilters] = useState<SearchFilters | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'loading' })
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)

  /** Reloads everything from the backend, re-running the active search if there is one. */
  const reload = useCallback(async (active: SearchFilters | null) => {
    try {
      const everything = await listVehicles()
      setAll(everything)
      setResults(active ? await searchVehicles(active) : null)
      setStatus({ kind: 'ready' })
    } catch (error) {
      setStatus({ kind: 'error', message: messageOf(error) })
    }
  }, [])

  useEffect(() => {
    void reload(null)
  }, [reload])

  async function search(active: SearchFilters) {
    setFilters(active)
    setFeedback(null)
    setStatus({ kind: 'loading' })
    try {
      setResults(await searchVehicles(active))
      setStatus({ kind: 'ready' })
    } catch (error) {
      setStatus({ kind: 'error', message: messageOf(error) })
    }
  }

  function resetSearch() {
    setFilters(null)
    setFeedback(null)
    setStatus({ kind: 'loading' })
    void reload(null)
  }

  /** Applies a confirmed backend change to the full list and to the current results. */
  const apply = useCallback((change: (vehicles: Vehicle[]) => Vehicle[]) => {
    setAll(change)
    setResults((current) => (current ? change(current) : current))
  }, [])

  const replace = useCallback(
    (updated: Vehicle) => apply((vehicles) => vehicles.map((v) => (v.id === updated.id ? updated : v))),
    [apply],
  )

  async function purchase(vehicle: Vehicle) {
    setPurchasingId(vehicle.id)
    setFeedback(null)
    try {
      replace(await purchaseVehicle(vehicle.id))
      setFeedback({ tone: 'success', text: `Purchased 1 × ${nameOf(vehicle)}` })
    } catch (error) {
      setFeedback({ tone: 'error', text: messageOf(error) })
      // The stock (or the vehicle) changed on the server: show what is there now.
      if (error instanceof ApiError && (error.status === 404 || error.status === 409)) await reload(filters)
    } finally {
      setPurchasingId(null)
    }
  }

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const vehicle of all) {
      const key = vehicle.category.toLowerCase()
      if (!seen.has(key)) seen.set(key, vehicle.category)
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b))
  }, [all])

  return {
    all,
    visible: results ?? all,
    searching: filters !== null,
    status,
    categories,
    purchasingId,
    feedback,
    setFeedback,
    retry: () => {
      setStatus({ kind: 'loading' })
      void reload(filters)
    },
    search,
    resetSearch,
    purchase,
    replace,
    add: (vehicle: Vehicle) => apply((vehicles) => [...vehicles, vehicle]),
    remove: (vehicle: Vehicle) => apply((vehicles) => vehicles.filter((v) => v.id !== vehicle.id)),
  }
}

export type Inventory = ReturnType<typeof useInventory>
