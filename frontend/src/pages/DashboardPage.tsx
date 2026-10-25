import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '../api/client'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
  type SearchFilters,
  type Vehicle,
  type VehicleInput,
} from '../api/vehicles'
import { useAuth } from '../auth/AuthContext'
import { ConfirmDeleteDialog, RestockDialog } from '../components/AdminDialogs'
import { AppHeader } from '../components/AppHeader'
import { FilterBar } from '../components/FilterBar'
import { InventoryTable, type RowActions } from '../components/InventoryTable'
import { VehicleFormPanel } from '../components/VehicleFormPanel'
import { Alert, Button } from '../components/ui'
import { plural } from '../lib/format'

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; vehicles: Vehicle[] }

/** Which admin panel or dialog is open, if any. */
type AdminTask =
  | { kind: 'add' }
  | { kind: 'edit'; vehicle: Vehicle }
  | { kind: 'restock'; vehicle: Vehicle }
  | { kind: 'delete'; vehicle: Vehicle }
  | null

const nameOf = (vehicle: Vehicle) => `${vehicle.make} ${vehicle.model}`

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
}

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [filters, setFilters] = useState<SearchFilters | null>(null)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [task, setTask] = useState<AdminTask>(null)

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

  function updateList(change: (vehicles: Vehicle[]) => Vehicle[]) {
    setLoad((current) => (current.status === 'ready' ? { ...current, vehicles: change(current.vehicles) } : current))
  }

  /** Runs an admin change; errors propagate so the open panel or dialog can show them. */
  async function completeTask(action: () => Promise<void>, message: string) {
    await action()
    setTask(null)
    setFeedback({ tone: 'success', text: message })
  }

  async function handleSave(input: VehicleInput) {
    if (task?.kind === 'edit') {
      const saved = await updateVehicle(task.vehicle.id, input)
      await completeTask(async () => replaceVehicle(saved), `Saved ${nameOf(saved)}`)
    } else {
      const created = await createVehicle(input)
      await completeTask(async () => updateList((vehicles) => [...vehicles, created]), `Added ${nameOf(created)}`)
    }
  }

  async function handleRestock(vehicle: Vehicle, units: number) {
    const restocked = await restockVehicle(vehicle.id, units)
    await completeTask(async () => replaceVehicle(restocked), `Restocked ${nameOf(vehicle)}`)
  }

  async function handleDelete(vehicle: Vehicle) {
    await deleteVehicle(vehicle.id)
    await completeTask(
      async () => updateList((vehicles) => vehicles.filter((v) => v.id !== vehicle.id)),
      `Deleted ${nameOf(vehicle)}`,
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
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 pt-8 pb-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <Summary load={load} searching={filters !== null} />
        </div>
        {isAdmin && <Button onClick={() => setTask({ kind: 'add' })}>Add vehicle</Button>}
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
          onRetry={() => applyFilters(filters)}
          actions={{
            isAdmin,
            purchasingId,
            onPurchase: handlePurchase,
            onEdit: (vehicle) => setTask({ kind: 'edit', vehicle }),
            onRestock: (vehicle) => setTask({ kind: 'restock', vehicle }),
            onDelete: (vehicle) => setTask({ kind: 'delete', vehicle }),
          }}
        />
      </main>
      {isAdmin && task && (task.kind === 'add' || task.kind === 'edit') && (
        <VehicleFormPanel
          key={task.kind === 'edit' ? task.vehicle.id : 'new'}
          vehicle={task.kind === 'edit' ? task.vehicle : undefined}
          onSave={handleSave}
          onClose={() => setTask(null)}
        />
      )}
      {isAdmin && task?.kind === 'restock' && (
        <RestockDialog
          vehicle={task.vehicle}
          onRestock={(units) => handleRestock(task.vehicle, units)}
          onClose={() => setTask(null)}
        />
      )}
      {isAdmin && task?.kind === 'delete' && (
        <ConfirmDeleteDialog vehicle={task.vehicle} onConfirm={() => handleDelete(task.vehicle)} onClose={() => setTask(null)} />
      )}
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
  onRetry: () => void
  actions: RowActions
}

function Results({ load, searching, onRetry, actions }: ResultsProps) {
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
  return <InventoryTable vehicles={load.vehicles} {...actions} />
}
