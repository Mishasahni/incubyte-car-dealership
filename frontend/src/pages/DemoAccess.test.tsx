import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { demoLogin, getDemoStatus } from '../api/auth'
import { ApiError } from '../api/client'
import { listVehicles } from '../api/vehicles'
import { loadSession } from '../auth/session'
import { ADMIN, BUYER, renderApp } from '../test/renderApp'

vi.mock('../api/auth')
vi.mock('../api/vehicles')

const BOTH = { enabled: true, roles: ['buyer', 'admin'] as const }

async function openDemoDialog() {
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Explore the demo' }))
  return screen.getByRole('dialog', { name: 'Explore the demo' })
}

describe('Demo access', () => {
  it('FE-DEMO-01: is not offered when the server has demo access off', async () => {
    vi.mocked(getDemoStatus).mockResolvedValue({ enabled: false, roles: [] })
    renderApp('/login')

    await waitFor(() => expect(getDemoStatus).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Explore the demo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('FE-DEMO-02: is not offered when the demo status cannot be loaded', async () => {
    vi.mocked(getDemoStatus).mockRejectedValue(new Error('offline'))
    renderApp('/login')

    await waitFor(() => expect(getDemoStatus).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Explore the demo' })).not.toBeInTheDocument()
  })

  it('FE-DEMO-03: offers a buyer and an admin demo, each explained', async () => {
    vi.mocked(getDemoStatus).mockResolvedValue({ ...BOTH, roles: [...BOTH.roles] })
    renderApp('/login')

    const dialog = await openDemoDialog()

    expect(within(dialog).getByRole('button', { name: 'Explore as Buyer' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Explore as Admin' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent('browse and search the inventory')
    expect(dialog).toHaveTextContent('add, edit, restock and delete vehicles')
  })

  it('FE-DEMO-04: the buyer demo signs in through the server and opens the storefront', async () => {
    vi.mocked(getDemoStatus).mockResolvedValue({ ...BOTH, roles: [...BOTH.roles] })
    vi.mocked(demoLogin).mockResolvedValue({ access_token: 'demo-jwt', token_type: 'bearer', user: BUYER })
    vi.mocked(listVehicles).mockResolvedValue([])
    renderApp('/login')

    await userEvent.setup().click(within(await openDemoDialog()).getByRole('button', { name: 'Explore as Buyer' }))

    expect(demoLogin).toHaveBeenCalledWith('buyer')
    expect(await screen.findByRole('heading', { name: 'Find your next car' })).toBeInTheDocument()
    expect(loadSession()).toEqual({ token: 'demo-jwt', user: BUYER })
  })

  it('FE-DEMO-05: the admin demo signs in through the server and opens Inventory Management', async () => {
    vi.mocked(getDemoStatus).mockResolvedValue({ ...BOTH, roles: [...BOTH.roles] })
    vi.mocked(demoLogin).mockResolvedValue({ access_token: 'demo-jwt', token_type: 'bearer', user: ADMIN })
    vi.mocked(listVehicles).mockResolvedValue([])
    renderApp('/login')

    await userEvent.setup().click(within(await openDemoDialog()).getByRole('button', { name: 'Explore as Admin' }))

    expect(demoLogin).toHaveBeenCalledWith('admin')
    expect(await screen.findByRole('heading', { name: 'Inventory Management' })).toBeInTheDocument()
  })

  it('FE-DEMO-06: shows the server error and stays signed out', async () => {
    vi.mocked(getDemoStatus).mockResolvedValue({ ...BOTH, roles: [...BOTH.roles] })
    vi.mocked(demoLogin).mockRejectedValue(new ApiError(503, 'Demo account is not set up'))
    renderApp('/login')
    const dialog = await openDemoDialog()

    await userEvent.setup().click(within(dialog).getByRole('button', { name: 'Explore as Admin' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Demo account is not set up')
    expect(loadSession()).toBeNull()
  })

  it('FE-DEMO-07: offers only the roles the server lists', async () => {
    vi.mocked(getDemoStatus).mockResolvedValue({ enabled: true, roles: ['buyer'] })
    renderApp('/login')

    const dialog = await openDemoDialog()

    expect(within(dialog).getByRole('button', { name: 'Explore as Buyer' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Explore as Admin' })).not.toBeInTheDocument()
  })

  it('FE-DEMO-08: is not part of registration', async () => {
    vi.mocked(getDemoStatus).mockResolvedValue({ ...BOTH, roles: [...BOTH.roles] })
    renderApp('/register')

    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Explore the demo' })).not.toBeInTheDocument()
  })
})
