import { useState, type FormEvent } from 'react'

import { ApiError } from '../api/client'
import type { Vehicle } from '../api/vehicles'
import { Modal } from './Modal'
import { Alert, Button, TextField } from './ui'

function failure(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

/** Add a whole number of units (1 or more) to a vehicle's stock. */
export function RestockDialog({
  vehicle,
  onRestock,
  onClose,
}: {
  vehicle: Vehicle
  onRestock: (units: number) => Promise<void>
  onClose: () => void
}) {
  const [units, setUnits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setServerError(null)
    if (!/^\d+$/.test(units.trim()) || Number(units) < 1) {
      setError('Enter a whole number of 1 or more')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onRestock(Number(units))
    } catch (caught) {
      setServerError(failure(caught, 'Could not restock. Please try again.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Restock ${vehicle.make} ${vehicle.model}`}
      description={`Currently ${vehicle.quantity} in stock. The units you enter are added to that.`}
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {serverError && <Alert>{serverError}</Alert>}
        <TextField
          label="Units to add"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={units}
          onChange={(event) => setUnits(event.target.value)}
          error={error ?? undefined}
          hint={/^\d+$/.test(units.trim()) && Number(units) >= 1 ? `Stock will be ${vehicle.quantity + Number(units)}.` : 'A whole number of 1 or more.'}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add units'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/** Destructive actions always ask first. */
export function ConfirmDeleteDialog({
  vehicle,
  onConfirm,
  onClose,
}: {
  vehicle: Vehicle
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (caught) {
      setServerError(failure(caught, 'Could not delete. Please try again.'))
      setDeleting(false)
    }
  }

  return (
    <Modal
      role="alertdialog"
      title={`Delete ${vehicle.make} ${vehicle.model}?`}
      description="This removes the vehicle from the inventory. It can't be undone."
      onClose={onClose}
    >
      {serverError && (
        <div className="mb-4">
          <Alert>{serverError}</Alert>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" disabled={deleting} onClick={handleDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Modal>
  )
}
