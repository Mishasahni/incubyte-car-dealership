import type { Vehicle } from '../api/vehicles'
import { formatPrice, stockLabel } from '../lib/format'
import { Button } from './ui'

export interface RowActions {
  onPurchase: (vehicle: Vehicle) => void
  purchasingId: number | null
  isAdmin: boolean
  onEdit?: (vehicle: Vehicle) => void
  onRestock?: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
}

function StockStatus({ quantity }: { quantity: number }) {
  const tone = quantity === 0 ? 'text-danger' : quantity === 1 ? 'text-mist' : 'text-silver'
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${tone}`}>
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${quantity === 0 ? 'bg-danger' : quantity === 1 ? 'bg-mist' : 'bg-success'}`}
      />
      {stockLabel(quantity)}
    </span>
  )
}

const CELL = 'px-4 py-3 md:py-4'
const STACK = 'max-md:flex max-md:items-center max-md:justify-between max-md:px-0 max-md:py-1'

/** A table on tablet and desktop; each row becomes a stacked block on phones. */
export function InventoryTable({ vehicles, ...actions }: { vehicles: Vehicle[] } & RowActions) {
  return (
    <table className="w-full border-collapse text-left">
      <thead className="max-md:sr-only">
        <tr className="border-b border-line text-xs tracking-wider text-silver uppercase">
          <th scope="col" className={`${CELL} font-medium`}>Vehicle</th>
          <th scope="col" className={`${CELL} font-medium`}>Category</th>
          <th scope="col" className={`${CELL} text-right font-medium`}>Price</th>
          <th scope="col" className={`${CELL} font-medium`}>Stock</th>
          <th scope="col" className={`${CELL} text-right font-medium`}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <VehicleRow key={vehicle.id} vehicle={vehicle} {...actions} />
        ))}
      </tbody>
    </table>
  )
}

function VehicleRow({ vehicle, onPurchase, purchasingId, isAdmin, onEdit, onRestock, onDelete }: { vehicle: Vehicle } & RowActions) {
  const name = `${vehicle.make} ${vehicle.model}`
  const purchasing = purchasingId === vehicle.id
  return (
    <tr
      aria-label={name}
      className="border-b border-line transition-colors hover:bg-panel max-md:block max-md:px-4 max-md:py-4"
    >
      <td className={`${CELL} max-md:block max-md:px-0 max-md:pb-2`}>
        <div className="text-xs tracking-wider text-silver uppercase">{vehicle.make}</div>
        <div className="text-base font-semibold text-mist">{vehicle.model}</div>
      </td>
      <td className={`${CELL} ${STACK} text-sm text-silver`}>
        <span className="text-xs text-silver/70 uppercase md:hidden">Category</span>
        {vehicle.category}
      </td>
      <td className={`${CELL} ${STACK} text-right font-medium tabular-nums`}>
        <span className="text-xs font-normal text-silver/70 uppercase md:hidden">Price</span>
        {formatPrice(vehicle.price)}
      </td>
      <td className={`${CELL} ${STACK}`}>
        <span className="text-xs text-silver/70 uppercase md:hidden">Stock</span>
        <StockStatus quantity={vehicle.quantity} />
      </td>
      <td className={`${CELL} max-md:block max-md:px-0 max-md:pt-3`}>
        <div className="flex flex-wrap items-center justify-end gap-1 max-md:justify-start">
          {isAdmin && (
            <>
              <Button variant="ghost" className="h-9 px-3" aria-label={`Edit ${name}`} onClick={() => onEdit?.(vehicle)}>
                Edit
              </Button>
              <Button variant="ghost" className="h-9 px-3" aria-label={`Restock ${name}`} onClick={() => onRestock?.(vehicle)}>
                Restock
              </Button>
              <Button variant="ghost" className="h-9 px-3 hover:text-danger" aria-label={`Delete ${name}`} onClick={() => onDelete?.(vehicle)}>
                Delete
              </Button>
            </>
          )}
          <Button
            variant="outline"
            className="ml-1 h-9 min-w-28"
            aria-label={`Purchase ${name}`}
            disabled={vehicle.quantity === 0 || purchasing}
            onClick={() => onPurchase(vehicle)}
          >
            {vehicle.quantity === 0 ? 'Out of stock' : purchasing ? 'Purchasing…' : 'Purchase'}
          </Button>
        </div>
      </td>
    </tr>
  )
}
