import { useState } from 'react'

import type { SearchFilters } from '../api/vehicles'
import { useFilterForm } from '../inventory/useFilterForm'
import { Button, SelectField, TextField } from './ui'

interface BuyerFiltersProps {
  categories: string[]
  inStockOnly: boolean
  onInStockOnlyChange: (value: boolean) => void
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
}

/** The buyer's filter rail; below the large breakpoint it folds behind a Filters button. */
export function BuyerFilters({ categories, inStockOnly, onInStockOnlyChange, onSearch, onReset }: BuyerFiltersProps) {
  const { bind, submit, reset, rangeError } = useFilterForm(onSearch, () => {
    onInStockOnlyChange(false)
    onReset()
  })
  const [open, setOpen] = useState(false)

  return (
    <aside aria-label="Filters" className="lg:w-64 lg:shrink-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded border border-line bg-surface px-4 text-sm font-medium lg:hidden"
      >
        Filters
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d={open ? 'M3 7.5 6 4.5 9 7.5' : 'M3 4.5 6 7.5 9 4.5'} />
        </svg>
      </button>
      <form
        noValidate
        onSubmit={submit}
        className={`${open ? 'grid' : 'hidden'} mt-3 gap-5 rounded bg-surface p-4 sm:grid-cols-2 lg:mt-0 lg:flex lg:flex-col lg:bg-transparent lg:p-0`}
      >
        <TextField label="Make" placeholder="e.g. Toyota" {...bind('make')} />
        <TextField label="Model" placeholder="e.g. Corolla" {...bind('model')} />
        <SelectField label="Category" {...bind('category')}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Min price" type="number" min={0} inputMode="decimal" placeholder="₹" error={rangeError ?? undefined} {...bind('min_price')} />
          <TextField label="Max price" type="number" min={0} inputMode="decimal" placeholder="₹" {...bind('max_price')} />
        </div>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[13px] font-medium text-graphite">Availability</legend>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="radio" name="availability" checked={!inStockOnly} onChange={() => onInStockOnlyChange(false)} className="size-4 accent-ink" />
            All vehicles
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="radio" name="availability" checked={inStockOnly} onChange={() => onInStockOnlyChange(true)} className="size-4 accent-ink" />
            In stock only
          </label>
        </fieldset>
        <div className="flex gap-2 sm:col-span-2 sm:self-end">
          <Button type="submit" className="flex-1">
            Search
          </Button>
          <Button type="button" variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </form>
    </aside>
  )
}
