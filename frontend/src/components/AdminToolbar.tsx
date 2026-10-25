import type { SearchFilters } from '../api/vehicles'
import { useFilterForm } from '../inventory/useFilterForm'
import { Button, SelectField, TextField } from './ui'

interface AdminToolbarProps {
  categories: string[]
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
}

/** The admin's compact one-row search, wrapping onto more rows on smaller screens. */
export function AdminToolbar({ categories, onSearch, onClear }: AdminToolbarProps) {
  const { bind, submit, reset, rangeError } = useFilterForm(onSearch, onClear)
  return (
    <form
      noValidate
      aria-label="Search inventory"
      onSubmit={submit}
      className="grid grid-cols-2 gap-3 rounded bg-surface p-4 md:grid-cols-[repeat(5,minmax(0,1fr))_auto] md:items-start"
    >
      <TextField label="Make" placeholder="Any" {...bind('make')} />
      <TextField label="Model" placeholder="Any" {...bind('model')} />
      <SelectField label="Category" className="col-span-2 md:col-span-1" {...bind('category')}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </SelectField>
      <TextField label="Min price" type="number" min={0} inputMode="decimal" placeholder="₹" error={rangeError ?? undefined} {...bind('min_price')} />
      <TextField label="Max price" type="number" min={0} inputMode="decimal" placeholder="₹" {...bind('max_price')} />
      <div className="col-span-2 flex gap-2 md:col-span-1 md:pt-[26px]">
        <Button type="submit" variant="dark" className="flex-1 md:flex-none">
          Search
        </Button>
        <Button type="button" variant="secondary" onClick={reset} className="flex-1 md:flex-none">
          Clear
        </Button>
      </div>
    </form>
  )
}
