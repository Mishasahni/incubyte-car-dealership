import { stockLabel } from '../lib/format'

/** Green in stock, amber for the last unit, grey when sold out; the text always says which. */
export function StockIndicator({ quantity }: { quantity: number }) {
  const tone = quantity === 0 ? 'text-muted' : quantity === 1 ? 'text-warn' : 'text-success'
  const dot = quantity === 0 ? 'bg-muted' : quantity === 1 ? 'bg-warn' : 'bg-success'
  return (
    <span className={`inline-flex items-center gap-2 text-[13px] font-medium ${tone}`}>
      <span aria-hidden="true" className={`size-2 rounded-full ${dot}`} />
      {stockLabel(quantity)}
    </span>
  )
}

/** The admin table's quantity cell: the number, plus a tag when stock needs attention. */
export function QuantityCell({ quantity }: { quantity: number }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-sm">
        <span className="font-semibold tabular-nums">{quantity}</span>
        {quantity > 0 && <span className="text-muted"> in stock</span>}
      </span>
      {quantity === 0 && (
        <span className="rounded-sm bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">Out of stock</span>
      )}
      {quantity === 1 && <span className="rounded-sm bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">Low</span>}
    </span>
  )
}
