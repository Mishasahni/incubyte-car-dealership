import { useState, type FormEvent } from 'react'

import type { SearchFilters } from '../api/vehicles'

const EMPTY = { make: '', model: '', category: '', min_price: '', max_price: '' }
type Field = keyof typeof EMPTY

/** Search form state shared by the buyer's filter rail and the admin toolbar. */
export function useFilterForm(onSearch: (filters: SearchFilters) => void, onReset: () => void) {
  const [values, setValues] = useState(EMPTY)
  const [rangeError, setRangeError] = useState<string | null>(null)

  const bind = (field: Field) => ({
    value: values[field],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const { min_price, max_price } = values
    if (min_price && max_price && Number(min_price) > Number(max_price)) {
      setRangeError("Min price can't be above max price")
      return
    }
    setRangeError(null)
    // Only the filters the user filled in are sent.
    const filled = Object.entries(values)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== '')
    onSearch(Object.fromEntries(filled) as SearchFilters)
  }

  function reset() {
    setValues(EMPTY)
    setRangeError(null)
    onReset()
  }

  return { bind, submit, reset, rangeError }
}
