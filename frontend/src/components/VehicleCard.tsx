import { useId } from 'react'

import type { Vehicle } from '../api/vehicles'
import { formatPrice } from '../lib/format'
import { StockIndicator } from './StockIndicator'
import { Button } from './ui'
import { VehicleIllustration } from './VehicleIllustration'

interface VehicleCardProps {
  vehicle: Vehicle
  purchasing: boolean
  onPurchase: (vehicle: Vehicle) => void
}

/** A buyer's view of one vehicle: name and price first, the body style, stock and Purchase. */
export function VehicleCard({ vehicle, purchasing, onPurchase }: VehicleCardProps) {
  const headingId = useId()
  const name = `${vehicle.make} ${vehicle.model}`
  const soldOut = vehicle.quantity === 0
  return (
    <article aria-labelledby={headingId} className="flex h-full flex-col gap-4 rounded bg-surface p-5">
      <div className="flex items-start sm:min-h-[4.5rem] justify-between gap-3">
        <div className="min-w-0">
          <h3 id={headingId} className="text-lg leading-tight font-semibold">
            {name}
          </h3>
          <p className="mt-1 text-[13px] text-muted">{vehicle.category}</p>
        </div>
        <p className="text-[17px] leading-tight font-semibold whitespace-nowrap tabular-nums">{formatPrice(vehicle.price)}</p>
      </div>
      <VehicleIllustration category={vehicle.category} />
      <StockIndicator quantity={vehicle.quantity} />
      <Button
        className="mt-auto w-full"
        aria-label={`Purchase ${name}`}
        disabled={soldOut || purchasing}
        onClick={() => onPurchase(vehicle)}
      >
        {soldOut ? 'Out of stock' : purchasing ? 'Purchasing…' : 'Purchase'}
      </Button>
    </article>
  )
}
