import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '../api/client'
import { listVehicles, purchaseVehicle, searchVehicles, type SearchFilters, type Vehicle } from '../api/vehicles'
import { useAuth } from '../auth/AuthContext'
import { AppHeader } from '../components/AppHeader'
import { FilterBar } from '../components/FilterBar'
import { InventoryTable } from '../components/InventoryTable'
import { Alert, Button } from '../components/ui'
import { plural } from '../lib/format'

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; vehicles: Vehicle[] }

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
}

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [filters, setFilters] = useState<SearchFilters | null>(null)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const refresh = useCallback(async (active: SearchFilters | null) => {
    try {
      const vehicles = active ? await searchVehicles(active) : await listVehicles()
      setLoad({ status: 'ready', vehicles })
    } catch (error) {
      setLoad({ status: 'error', message: messageOf(error) })
    }
  }, [])

  useEffect(() => {
    void refresh(null)
  }, [refresh])

  function applyFilters(next: SearchFilters | null) {
    setFilters(next)
    setFeedback(null)
    setLoad({ status: 'loading' })
    void refresh(next)
  }

  function replaceVehicle(updated: Vehicle) {
    setLoad((current) =>
      current.status === 'ready'
        ? { ...current, vehicles: current.vehicles.map((v) => (v.id === updated.id ? updated : v)) }
        : current,
    )
  }

  async function handlePurchase(vehicle: Vehicle) {
    setPurchasingId(vehicle.id)
    setFeedback(null)
    try {
      replaceVehicle(await purchaseVehicle(vehicle.id))
      setFeedback({ tone: 'success', text: `Purchased 1 × ${vehicle.make} ${vehicle.model}` })
    } catch (error) {
      setFeedback({ tone: 'error', text: messageOf(error) })
      if (error instanceof ApiError && error.status === 409) await refresh(filters)
    } finally {
      setPurchasingId(null)
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <Summary load={load} searching={filters !== null} />
      </div>
      <FilterBar onSearch={applyFilters} onClear={() => applyFilters(null)} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {feedback && (
          <div className="mb-4">
            <Alert tone={feedback.tone}>{feedback.text}</Alert>
          </div>
        )}
        <Results
          load={load}
          searching={filters !== null}
          isAdmin={isAdmin}
          purchasingId={purchasingId}
          onPurchase={handlePurchase}
          onRetry={() => applyFilters(filters)}
        />
      </main>
    </div>
  )
}

function Summary({ load, searching }: { load: Load; searching: boolean }) {
  if (load.status !== 'ready') return <p className="mt-1 h-5 text-sm text-silver" />
  const { vehicles } = load
  const text = searching
    ? plural(vehicles.length, 'result')
    : `${plural(vehicles.length, 'vehicle')} · ${vehicles.filter((v) => v.quantity === 0).length} out of stock`
  return <p className="mt-1 text-sm text-silver">{text}</p>
}

interface ResultsProps {
  load: Load
  searching: boolean
  isAdmin: boolean
  purchasingId: number | null
  onPurchase: (vehicle: Vehicle) => void
  onRetry: () => void
}

function Results({ load, searching, isAdmin, purchasingId, onPurchase, onRetry }: ResultsProps) {
  if (load.status === 'loading') {
    return (
      <div aria-busy="true" className="space-y-px">
        <p className="sr-only">Loading inventory…</p>
        {[0, 1, 2].map((key) => (
          <div key={key} aria-hidden="true" className="h-16 animate-pulse border-b border-line bg-panel/70" />
        ))}
      </div>
    )
  }
  if (load.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert>{load.message}</Alert>
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }
  if (load.vehicles.length === 0) {
    return (
      <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-silver">
        {searching ? 'No vehicles match these filters.' : 'No vehicles in inventory yet.'}
      </p>
    )
  }
  return <InventoryTable vehicles={load.vehicles} isAdmin={isAdmin} purchasingId={purchasingId} onPurchase={onPurchase} />
}
