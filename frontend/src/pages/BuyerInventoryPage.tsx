import { useState } from 'react'

import { BuyerFilters } from '../components/BuyerFilters'
import { EmptyState, ErrorState, LoadingState } from '../components/states'
import { StoreHeader } from '../components/StoreHeader'
import { Alert, Button } from '../components/ui'
import { VehicleCard } from '../components/VehicleCard'
import { useInventory } from '../inventory/useInventory'
import { plural } from '../lib/format'

/** The buyer's storefront: browse, search and filter, and purchase one vehicle at a time. */
export function BuyerInventoryPage() {
  const inventory = useInventory()
  const [inStockOnly, setInStockOnly] = useState(false)
  const { all, status, searching, feedback } = inventory
  const vehicles = inStockOnly ? inventory.visible.filter((v) => v.quantity > 0) : inventory.visible
  const filtered = searching || inStockOnly

  function resetAll() {
    setInStockOnly(false)
    inventory.resetSearch()
  }

  return (
    <div className="min-h-screen">
      <StoreHeader />
      <section className="bg-surface">
        <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-7 sm:px-10 sm:pt-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[40px]">Find your next car</h1>
          <p className="mt-2 h-5 text-[15px] text-muted">
            {status.kind === 'ready' &&
              (searching
                ? plural(inventory.visible.length, 'result')
                : `${plural(all.length, 'vehicle')} · ${all.filter((v) => v.quantity > 0).length} available`)}
          </p>
        </div>
      </section>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-10 sm:py-8 lg:flex-row lg:items-start lg:gap-8">
        <BuyerFilters
          categories={inventory.categories}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={setInStockOnly}
          onSearch={inventory.search}
          onReset={inventory.resetSearch}
        />
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}
          {status.kind === 'loading' && (
            <LoadingState blocks={6} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 [&>*]:h-96" />
          )}
          {status.kind === 'error' && <ErrorState message={status.message} onRetry={inventory.retry} />}
          {status.kind === 'ready' && vehicles.length === 0 && (
            <EmptyState
              action={
                filtered && (
                  <Button variant="secondary" onClick={resetAll}>
                    Reset filters
                  </Button>
                )
              }
            >
              {filtered ? 'No vehicles match these filters.' : 'No vehicles in inventory yet.'}
            </EmptyState>
          )}
          {status.kind === 'ready' && vehicles.length > 0 && (
            <ul aria-label="Vehicles" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <VehicleCard
                    vehicle={vehicle}
                    purchasing={inventory.purchasingId === vehicle.id}
                    onPurchase={inventory.purchase}
                  />
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
