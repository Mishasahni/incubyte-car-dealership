import type { Vehicle } from '../api/vehicles'
import { formatPrice } from '../lib/format'
import { QuantityCell } from './StockIndicator'
import { Button } from './ui'

export interface RowActions {
  purchasingId: number | null
  onPurchase: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
  onRestock: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

const HEAD = 'px-4 py-3 text-xs font-semibold tracking-wider text-muted uppercase'
const CELL = 'px-4 py-3.5 align-middle'
/** On phones each cell becomes a labelled line inside a stacked row. */
const STACK = 'max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1'

/** The admin's management table on tablet and desktop; stacked rows on phones. */
export function InventoryTable({ vehicles, ...actions }: { vehicles: Vehicle[] } & RowActions) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="border-b border-hairline max-md:sr-only">
        <tr>
          <th scope="col" className={`${HEAD} pl-5`}>Make / Model</th>
          <th scope="col" className={HEAD}>Category</th>
          <th scope="col" className={`${HEAD} text-right`}>Price</th>
          <th scope="col" className={HEAD}>Quantity</th>
          <th scope="col" className={`${HEAD} pr-5 text-right`}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <Row key={vehicle.id} vehicle={vehicle} {...actions} />
        ))}
      </tbody>
    </table>
  )
}

function Row({ vehicle, purchasingId, onPurchase, onEdit, onRestock, onDelete }: { vehicle: Vehicle } & RowActions) {
  const name = `${vehicle.make} ${vehicle.model}`
  const purchasing = purchasingId === vehicle.id
  return (
    <tr aria-label={name} className="border-b border-hairline last:border-b-0 hover:bg-sunken max-md:block max-md:px-4 max-md:py-4">
      <td className={`${CELL} pl-5 max-md:block max-md:px-0 max-md:pb-2`}>
        <span className="font-semibold">{vehicle.make}</span> {vehicle.model}
      </td>
      <td className={`${CELL} ${STACK} text-graphite`}>
        <span className="text-xs text-muted md:hidden">Category</span>
        {vehicle.category}
      </td>
      <td className={`${CELL} ${STACK} text-right tabular-nums`}>
        <span className="text-xs text-muted md:hidden">Price</span>
        {formatPrice(vehicle.price)}
      </td>
      <td className={`${CELL} ${STACK}`}>
        <span className="text-xs text-muted md:hidden">Quantity</span>
        <QuantityCell quantity={vehicle.quantity} />
      </td>
      <td className={`${CELL} pr-5 max-md:block max-md:px-0 max-md:pt-3`}>
        <div className="flex flex-wrap items-center justify-end gap-1 max-md:justify-start">
          <Button
            variant="ghost"
            className="h-8 px-2.5 text-[13px]"
            aria-label={`Purchase ${name}`}
            disabled={vehicle.quantity === 0 || purchasing}
            onClick={() => onPurchase(vehicle)}
          >
            {purchasing ? 'Purchasing…' : 'Purchase'}
          </Button>
          <Button variant="ghost" className="h-8 px-2.5 text-[13px]" aria-label={`Edit ${name}`} onClick={() => onEdit(vehicle)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-[13px] text-accent"
            aria-label={`Restock ${name}`}
            onClick={() => onRestock(vehicle)}
          >
            Restock
          </Button>
          <Button variant="danger-ghost" className="h-8 px-2.5 text-[13px]" aria-label={`Delete ${name}`} onClick={() => onDelete(vehicle)}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}
