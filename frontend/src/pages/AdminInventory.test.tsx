import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { User } from '../api/auth'
import { ApiError } from '../api/client'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  restockVehicle,
  updateVehicle,
  type Vehicle,
} from '../api/vehicles'
import { ADMIN, BUYER, renderApp, signInAs } from '../test/renderApp'

vi.mock('../api/auth')
vi.mock('../api/vehicles')

const COROLLA: Vehicle = { id: 1, make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 2 }

async function openInventoryAs(user: User, vehicles: Vehicle[] = [COROLLA]) {
  vi.mocked(listVehicles).mockResolvedValue(vehicles)
  signInAs(user)
  renderApp('/')
  await screen.findByRole('row', { name: /Toyota Corolla/ })
}

async function fill(dialog: HTMLElement, fields: Record<string, string>) {
  const user = userEvent.setup()
  for (const [label, value] of Object.entries(fields)) {
    const input = within(dialog).getByLabelText(label)
    await user.clear(input)
    if (value) await user.type(input, value)
  }
}

describe('Admin controls', () => {
  it('FE-ADM-01: a regular user sees no admin controls', async () => {
    await openInventoryAs(BUYER)

    expect(screen.queryByRole('button', { name: 'Add vehicle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(Edit|Restock|Delete) / })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Purchase Toyota Corolla' })).toBeInTheDocument()
  })

  it('FE-ADM-02: an admin sees Add vehicle and per-vehicle controls', async () => {
    await openInventoryAs(ADMIN)

    expect(screen.getByRole('button', { name: 'Add vehicle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Toyota Corolla' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restock Toyota Corolla' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Toyota Corolla' })).toBeInTheDocument()
  })
})

describe('Add vehicle', () => {
  it('FE-ADM-03: validates every field without calling the API', async () => {
    await openInventoryAs(ADMIN)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = screen.getByRole('dialog', { name: 'Add vehicle' })

    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))
    expect(within(dialog).getByText('Make is required')).toBeInTheDocument()
    expect(within(dialog).getByText('Model is required')).toBeInTheDocument()
    expect(within(dialog).getByText('Category is required')).toBeInTheDocument()

    await fill(dialog, { Make: 'Ford', Model: 'F-150', Category: 'Truck', Price: '0', Quantity: '1.5' })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))
    expect(within(dialog).getByText('Enter a price above 0')).toBeInTheDocument()
    expect(within(dialog).getByText('Enter a whole number of 0 or more')).toBeInTheDocument()

    expect(createVehicle).not.toHaveBeenCalled()
  })

  it('rejects a price longer than the backend accepts (found in the browser check)', async () => {
    await openInventoryAs(ADMIN)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = screen.getByRole('dialog', { name: 'Add vehicle' })

    await fill(dialog, { Make: 'Kia', Model: 'Seltos', Category: 'SUV', Price: '11990001199000', Quantity: '5' })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))

    expect(within(dialog).getByText('Price must be below ₹10,00,00,00,000')).toBeInTheDocument()
    expect(createVehicle).not.toHaveBeenCalled()
  })

  it('FE-ADM-04: saves a valid vehicle, closes the panel and lists it', async () => {
    vi.mocked(createVehicle).mockResolvedValue({ id: 9, make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 4 })
    await openInventoryAs(ADMIN)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = screen.getByRole('dialog', { name: 'Add vehicle' })

    await fill(dialog, { Make: 'Ford', Model: 'F-150', Category: 'Truck', Price: '45000', Quantity: '4' })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))

    expect(createVehicle).toHaveBeenCalledWith({ make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 4 })
    expect(await screen.findByRole('row', { name: /Ford F-150/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Added Ford F-150')).toBeInTheDocument()
  })

  it('FE-ADM-08: keeps the panel open and shows a server error', async () => {
    vi.mocked(createVehicle).mockRejectedValue(new ApiError(403, 'Admin access required'))
    await openInventoryAs(ADMIN)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = screen.getByRole('dialog', { name: 'Add vehicle' })

    await fill(dialog, { Make: 'Ford', Model: 'F-150', Category: 'Truck', Price: '45000', Quantity: '4' })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Admin access required')
    expect(within(dialog).getByLabelText('Make')).toHaveValue('Ford')
  })
})

describe('Edit, restock and delete', () => {
  it('FE-ADM-05: edit opens pre-filled and saves the changes', async () => {
    vi.mocked(updateVehicle).mockResolvedValue({ ...COROLLA, price: 21000 })
    await openInventoryAs(ADMIN)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Edit Toyota Corolla' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit Toyota Corolla' })
    expect(within(dialog).getByLabelText('Make')).toHaveValue('Toyota')
    expect(within(dialog).getByLabelText('Price')).toHaveValue(20000)

    await fill(dialog, { Price: '21000' })
    await user.click(within(dialog).getByRole('button', { name: 'Save vehicle' }))

    expect(updateVehicle).toHaveBeenCalledWith(1, { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 21000, quantity: 2 })
    expect(await screen.findByText('Saved Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Toyota Corolla/ })).toHaveTextContent('₹21,000.00')
  })

  it('FE-ADM-07: restock validates the amount and adds the units', async () => {
    vi.mocked(restockVehicle).mockResolvedValue({ ...COROLLA, quantity: 7 })
    await openInventoryAs(ADMIN)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Restock Toyota Corolla' }))
    const dialog = screen.getByRole('dialog', { name: 'Restock Toyota Corolla' })

    await fill(dialog, { 'Units to add': '0' })
    await user.click(within(dialog).getByRole('button', { name: 'Add units' }))
    expect(within(dialog).getByText('Enter a whole number of 1 or more')).toBeInTheDocument()
    expect(restockVehicle).not.toHaveBeenCalled()

    await fill(dialog, { 'Units to add': '5' })
    await user.click(within(dialog).getByRole('button', { name: 'Add units' }))

    expect(restockVehicle).toHaveBeenCalledWith(1, 5)
    expect(await screen.findByText('Restocked Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Toyota Corolla/ })).toHaveTextContent('7 in stock')
  })

  it('FE-ADM-06: delete asks for confirmation; Cancel keeps it, Delete removes it', async () => {
    vi.mocked(deleteVehicle).mockResolvedValue(undefined)
    await openInventoryAs(ADMIN)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Delete Toyota Corolla' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
    expect(deleteVehicle).not.toHaveBeenCalled()
    expect(screen.getByRole('row', { name: /Toyota Corolla/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Toyota Corolla' }))
    const confirm = screen.getByRole('alertdialog', { name: 'Delete Toyota Corolla?' })
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }))

    expect(deleteVehicle).toHaveBeenCalledWith(1)
    expect(await screen.findByText('Deleted Toyota Corolla')).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Toyota Corolla/ })).not.toBeInTheDocument()
  })
})
