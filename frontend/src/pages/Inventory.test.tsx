import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { listVehicles, purchaseVehicle, searchVehicles, type Vehicle } from '../api/vehicles'
import { BUYER, renderApp, signInAs } from '../test/renderApp'

vi.mock('../api/auth')
vi.mock('../api/vehicles')

const COROLLA: Vehicle = { id: 1, make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 2 }
const RAV4: Vehicle = { id: 2, make: 'Toyota', model: 'RAV4', category: 'SUV', price: 30000, quantity: 0 }

function openInventory(vehicles: Vehicle[]) {
  vi.mocked(listVehicles).mockResolvedValue(vehicles)
  signInAs(BUYER)
  renderApp('/')
}

function row(name: string) {
  return screen.getByRole('row', { name: new RegExp(name) })
}

describe('Inventory', () => {
  it('FE-VEH-01: shows a loading state, then every vehicle with its details', async () => {
    openInventory([COROLLA, RAV4])

    expect(screen.getByText('Loading inventory…')).toBeInTheDocument()
    const corolla = await screen.findByRole('row', { name: /Toyota Corolla/ })
    expect(corolla).toHaveTextContent('Sedan')
    expect(corolla).toHaveTextContent('₹20,000.00')
    expect(corolla).toHaveTextContent('2 in stock')
    expect(row('Toyota RAV4')).toHaveTextContent('Out of stock')
    expect(screen.getByText('2 vehicles · 1 out of stock')).toBeInTheDocument()
  })

  it('FE-VEH-02: says so when the inventory is empty', async () => {
    openInventory([])

    expect(await screen.findByText('No vehicles in inventory yet.')).toBeInTheDocument()
  })

  it('FE-VEH-04 and FE-VEH-05: Purchase is enabled in stock and disabled at zero', async () => {
    openInventory([COROLLA, RAV4])
    await screen.findByRole('row', { name: /Toyota Corolla/ })

    expect(screen.getByRole('button', { name: 'Purchase Toyota Corolla' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Purchase Toyota RAV4' })).toBeDisabled()
  })

  it('FE-VEH-06: purchasing sends one request, updates the stock and confirms', async () => {
    vi.mocked(purchaseVehicle).mockResolvedValue({ ...COROLLA, quantity: 1 })
    openInventory([COROLLA])
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Purchase Toyota Corolla' }))

    expect(purchaseVehicle).toHaveBeenCalledTimes(1)
    expect(purchaseVehicle).toHaveBeenCalledWith(1)
    expect(await screen.findByText('Purchased 1 × Toyota Corolla')).toBeInTheDocument()
    expect(row('Toyota Corolla')).toHaveTextContent('1 left')
  })

  it('FE-VEH-07: buying the last unit disables Purchase', async () => {
    vi.mocked(purchaseVehicle).mockResolvedValue({ ...COROLLA, quantity: 0 })
    openInventory([{ ...COROLLA, quantity: 1 }])

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Purchase Toyota Corolla' }))

    expect(await screen.findByText('Purchased 1 × Toyota Corolla')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Purchase Toyota Corolla' })).toBeDisabled()
  })

  it('FE-VEH-08: a sold-out conflict shows the message and reloads the stock', async () => {
    vi.mocked(purchaseVehicle).mockRejectedValue(new ApiError(409, 'Vehicle is out of stock'))
    openInventory([{ ...COROLLA, quantity: 1 }])
    await screen.findByRole('row', { name: /Toyota Corolla/ })
    vi.mocked(listVehicles).mockResolvedValue([{ ...COROLLA, quantity: 0 }])

    await userEvent.setup().click(screen.getByRole('button', { name: 'Purchase Toyota Corolla' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle is out of stock')
    expect(await screen.findByRole('button', { name: 'Purchase Toyota Corolla' })).toBeDisabled()
  })
})

describe('Search and filter', () => {
  async function search(fields: Record<string, string>) {
    const user = userEvent.setup()
    for (const [label, value] of Object.entries(fields)) {
      await user.type(screen.getByLabelText(label), value)
    }
    await user.click(screen.getByRole('button', { name: 'Search' }))
  }

  it('FE-SRCH-01: sends every filled filter and shows the results', async () => {
    vi.mocked(searchVehicles).mockResolvedValue([COROLLA])
    openInventory([COROLLA, RAV4])
    await screen.findByRole('row', { name: /Toyota RAV4/ })

    await search({ Make: 'toy', Model: 'cor', Category: 'sedan', 'Min price': '15000', 'Max price': '25000' })

    expect(searchVehicles).toHaveBeenCalledWith({
      make: 'toy',
      model: 'cor',
      category: 'sedan',
      min_price: '15000',
      max_price: '25000',
    })
    expect(await screen.findByText('1 result')).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Toyota RAV4/ })).not.toBeInTheDocument()
  })

  it('FE-SRCH-02: leaves out empty filters', async () => {
    vi.mocked(searchVehicles).mockResolvedValue([COROLLA, RAV4])
    openInventory([COROLLA, RAV4])
    await screen.findByRole('row', { name: /Toyota RAV4/ })

    await search({ Make: 'toy' })

    expect(searchVehicles).toHaveBeenCalledWith({ make: 'toy' })
  })

  it('FE-SRCH-03: rejects a minimum above the maximum without searching', async () => {
    openInventory([COROLLA])
    await screen.findByRole('row', { name: /Toyota Corolla/ })

    await search({ 'Min price': '30000', 'Max price': '10000' })

    expect(screen.getByText("Min price can't be above max price")).toBeInTheDocument()
    expect(searchVehicles).not.toHaveBeenCalled()
  })

  it('FE-SRCH-04 and FE-SRCH-05: shows no matches, and Clear restores the full list', async () => {
    vi.mocked(searchVehicles).mockResolvedValue([])
    openInventory([COROLLA, RAV4])
    await screen.findByRole('row', { name: /Toyota RAV4/ })
    await search({ Make: 'tesla' })
    expect(await screen.findByText('No vehicles match these filters.')).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Clear' }))

    expect(await screen.findByRole('row', { name: /Toyota RAV4/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Make')).toHaveValue('')
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3)
  })
})
