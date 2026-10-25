import { useState } from 'react'

import { createVehicle, deleteVehicle, restockVehicle, updateVehicle, type Vehicle, type VehicleInput } from '../api/vehicles'
import { ConfirmDeleteDialog, RestockDialog } from '../components/AdminDialogs'
import { AdminShell, type AdminView } from '../components/AdminShell'
import { AdminToolbar } from '../components/AdminToolbar'
import { InventoryTable } from '../components/InventoryTable'
import { EmptyState, ErrorState, LoadingState } from '../components/states'
import { Alert, Button } from '../components/ui'
import { VehicleFormPanel } from '../components/VehicleFormPanel'
import { nameOf, useInventory } from '../inventory/useInventory'
import { plural } from '../lib/format'

/** Which admin panel or dialog is open, if any. */
type AdminTask =
  | { kind: 'add' }
  | { kind: 'edit'; vehicle: Vehicle }
  | { kind: 'restock'; vehicle: Vehicle }
  | { kind: 'delete'; vehicle: Vehicle }
  | null

const needsAttention = (vehicle: Vehicle) => vehicle.quantity <= 1

/** The admin console: stock at a glance, search, and add, edit, restock and delete. */
export function AdminInventoryPage() {
  const inventory = useInventory()
  const [view, setView] = useState<AdminView>('inventory')
  const [task, setTask] = useState<AdminTask>(null)
  const { all, status, feedback } = inventory
  const vehicles = view === 'attention' ? inventory.visible.filter(needsAttention) : inventory.visible

  /** Errors propagate, so the open panel or dialog shows them and stays open. */
  function finish(message: string) {
    setTask(null)
    inventory.setFeedback({ tone: 'success', text: message })
  }

  async function handleSave(input: VehicleInput) {
    if (task?.kind === 'edit') {
      const saved = await updateVehicle(task.vehicle.id, input)
      inventory.replace(saved)
      finish(`Saved ${nameOf(saved)}`)
    } else {
      const created = await createVehicle(input)
      inventory.add(created)
      finish(`Added ${nameOf(created)}`)
    }
  }

  async function handleRestock(vehicle: Vehicle, units: number) {
    inventory.replace(await restockVehicle(vehicle.id, units))
    finish(`Restocked ${nameOf(vehicle)}`)
  }

  async function handleDelete(vehicle: Vehicle) {
    await deleteVehicle(vehicle.id)
    inventory.remove(vehicle)
    finish(`Deleted ${nameOf(vehicle)}`)
  }

  return (
    <AdminShell
      view={view}
      counts={{ inventory: all.length, attention: all.filter(needsAttention).length }}
      onViewChange={setView}
    >
      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Inventory Management</h1>
          <Button onClick={() => setTask({ kind: 'add' })}>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6">
              <path d="M7 2v10M2 7h10" />
            </svg>
            Add vehicle
          </Button>
        </div>

        <section aria-label="Stock summary" className="rounded bg-surface">
          <dl className="grid grid-cols-3 divide-x divide-hairline">
            <Stat label="Vehicles" value={all.length} />
            <Stat label="Units in stock" value={all.reduce((sum, v) => sum + v.quantity, 0)} />
            <Stat label="Out of stock" value={all.filter((v) => v.quantity === 0).length} alert />
          </dl>
        </section>

        <AdminToolbar categories={inventory.categories} onSearch={inventory.search} onClear={inventory.resetSearch} />

        {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

        <section aria-labelledby="admin-list-heading" className="rounded bg-surface">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline px-5 py-4">
            <h2 id="admin-list-heading" className="text-base font-semibold">
              {view === 'attention' ? 'Stock attention' : 'All vehicles'}
            </h2>
            <p className="text-[13px] text-muted">
              {view === 'attention'
                ? 'Vehicles with one unit or none. Restock adds units to the current stock.'
                : status.kind === 'ready' && inventory.searching
                  ? plural(vehicles.length, 'result')
                  : null}
            </p>
          </div>
          {status.kind === 'loading' && <LoadingState blocks={4} className="flex flex-col gap-px p-2 [&>*]:h-12 [&>*]:bg-sunken" />}
          {status.kind === 'error' && (
            <div className="p-5">
              <ErrorState message={status.message} onRetry={inventory.retry} />
            </div>
          )}
          {status.kind === 'ready' && vehicles.length === 0 && (
            <EmptyState>
              {view === 'attention'
                ? 'Every vehicle has at least two units in stock.'
                : inventory.searching
                  ? 'No vehicles match these filters.'
                  : 'No vehicles in inventory yet. Add the first one.'}
            </EmptyState>
          )}
          {status.kind === 'ready' && vehicles.length > 0 && (
            <InventoryTable
              vehicles={vehicles}
              purchasingId={inventory.purchasingId}
              onPurchase={inventory.purchase}
              onEdit={(vehicle) => setTask({ kind: 'edit', vehicle })}
              onRestock={(vehicle) => setTask({ kind: 'restock', vehicle })}
              onDelete={(vehicle) => setTask({ kind: 'delete', vehicle })}
            />
          )}
        </section>
      </main>

      {task && (task.kind === 'add' || task.kind === 'edit') && (
        <VehicleFormPanel
          key={task.kind === 'edit' ? task.vehicle.id : 'new'}
          vehicle={task.kind === 'edit' ? task.vehicle : undefined}
          onSave={handleSave}
          onClose={() => setTask(null)}
        />
      )}
      {task?.kind === 'restock' && (
        <RestockDialog vehicle={task.vehicle} onRestock={(units) => handleRestock(task.vehicle, units)} onClose={() => setTask(null)} />
      )}
      {task?.kind === 'delete' && (
        <ConfirmDeleteDialog vehicle={task.vehicle} onConfirm={() => handleDelete(task.vehicle)} onClose={() => setTask(null)} />
      )}
    </AdminShell>
  )
}

function Stat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tabular-nums ${alert && value > 0 ? 'text-danger' : ''}`}>{value}</dd>
    </div>
  )
}
