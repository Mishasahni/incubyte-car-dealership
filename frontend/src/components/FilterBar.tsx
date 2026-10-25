import { useState, type FormEvent } from 'react'

import type { SearchFilters } from '../api/vehicles'
import { Button, TextField } from './ui'

const EMPTY = { make: '', model: '', category: '', min_price: '', max_price: '' }

interface FilterBarProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
}

/** Make/model/category text filters and an inclusive price range; collapses on phones. */
export function FilterBar({ onSearch, onClear }: FilterBarProps) {
  const [values, setValues] = useState(EMPTY)
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const set = (field: keyof typeof EMPTY) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const { min_price, max_price } = values
    if (min_price && max_price && Number(min_price) > Number(max_price)) {
      setRangeError("Min price can't be above max price")
      return
    }
    setRangeError(null)
    const filled = Object.entries(values)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== '')
    onSearch(Object.fromEntries(filled) as SearchFilters)
  }

  function handleClear() {
    setValues(EMPTY)
    setRangeError(null)
    onClear()
  }

  return (
    <section aria-label="Search and filter" className="border-y border-line bg-panel/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Button
          variant="ghost"
          className="w-full justify-between px-0 md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span>Filters</span>
          <span aria-hidden="true">{open ? '−' : '+'}</span>
        </Button>
        <form
          noValidate
          onSubmit={handleSubmit}
          className={`${open ? 'grid' : 'hidden'} grid-cols-2 gap-3 pb-4 md:grid md:grid-cols-[repeat(5,minmax(0,1fr))_auto] md:items-end md:py-4`}
        >
          <TextField label="Make" value={values.make} onChange={set('make')} className="col-span-2 md:col-span-1" />
          <TextField label="Model" value={values.model} onChange={set('model')} className="col-span-2 md:col-span-1" />
          <TextField label="Category" value={values.category} onChange={set('category')} className="col-span-2 md:col-span-1" />
          <TextField label="Min price" type="number" min={0} inputMode="decimal" value={values.min_price} onChange={set('min_price')} error={rangeError ?? undefined} />
          <TextField label="Max price" type="number" min={0} inputMode="decimal" value={values.max_price} onChange={set('max_price')} />
          <div className="col-span-2 flex gap-2 md:col-span-1">
            <Button type="submit" className="flex-1 md:flex-none">
              Search
            </Button>
            <Button type="button" variant="secondary" onClick={handleClear} className="flex-1 md:flex-none">
              Clear
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
