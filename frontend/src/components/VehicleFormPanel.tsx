import { useState, type FormEvent } from 'react'

import { ApiError } from '../api/client'
import type { Vehicle, VehicleInput } from '../api/vehicles'
import { Modal } from './Modal'
import { Alert, Button, TextField } from './ui'

type Field = 'make' | 'model' | 'category' | 'price' | 'quantity'
type Values = Record<Field, string>
type Errors = Partial<Record<Field, string>>

/** Same rules as the backend's VehicleCreate schema, for immediate feedback. */
function validate(values: Values): Errors {
  const errors: Errors = {}
  if (!values.make.trim()) errors.make = 'Make is required'
  if (!values.model.trim()) errors.model = 'Model is required'
  if (!values.category.trim()) errors.category = 'Category is required'
  const price = Number(values.price)
  if (!values.price || !(price > 0)) errors.price = 'Enter a price above 0'
  else if (!/^\d+(\.\d{1,2})?$/.test(values.price.trim())) errors.price = 'Use at most 2 decimal places'
  if (!/^\d+$/.test(values.quantity.trim())) errors.quantity = 'Enter a whole number of 0 or more'
  return errors
}

interface VehicleFormPanelProps {
  vehicle?: Vehicle
  onSave: (input: VehicleInput) => Promise<void>
  onClose: () => void
}

/** Add (no vehicle) or edit (pre-filled) a vehicle in a side panel. */
export function VehicleFormPanel({ vehicle, onSave, onClose }: VehicleFormPanelProps) {
  const [values, setValues] = useState<Values>({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: vehicle ? String(vehicle.quantity) : '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (field: Field) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setServerError(null)
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      await onSave({
        make: values.make.trim(),
        model: values.model.trim(),
        category: values.category.trim(),
        price: Number(values.price),
        quantity: Number(values.quantity),
      })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Could not save the vehicle. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Modal variant="panel" title={vehicle ? `Edit ${vehicle.make} ${vehicle.model}` : 'Add vehicle'} onClose={onClose}>
      <form noValidate onSubmit={handleSubmit} className="flex h-full flex-col gap-4">
        {serverError && <Alert>{serverError}</Alert>}
        <TextField label="Make" value={values.make} onChange={set('make')} error={errors.make} />
        <TextField label="Model" value={values.model} onChange={set('model')} error={errors.model} />
        <TextField label="Category" value={values.category} onChange={set('category')} error={errors.category} hint="For example Sedan, SUV or Truck" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Price" type="number" min={0} step="0.01" inputMode="decimal" value={values.price} onChange={set('price')} error={errors.price} hint="In rupees" />
          <TextField label="Quantity" type="number" min={0} step={1} inputMode="numeric" value={values.quantity} onChange={set('quantity')} error={errors.quantity} />
        </div>
        <div className="mt-auto flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
