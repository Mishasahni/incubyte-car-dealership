import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { listVehicles } from './api/vehicles'
import { loadSession } from './auth/session'
import { ADMIN, BUYER, renderApp, signInAs } from './test/renderApp'

vi.mock('./api/auth')
vi.mock('./api/vehicles')

describe('Session and routing', () => {
  it('FE-AUTH-09: sends a visitor without a session to the login page', () => {
    renderApp('/')

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('FE-AUTH-08: logging out from the account menu clears the session and returns to the login page', async () => {
    vi.mocked(listVehicles).mockResolvedValue([])
    signInAs(BUYER)
    renderApp('/')
    expect(screen.getByRole('heading', { name: 'Find your next car' })).toBeInTheDocument()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /buyer@dealership\.com/ }))
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(loadSession()).toBeNull()
  })
})

describe('Role-aware experiences', () => {
  it('FE-ROLE-01: an admin opening the app lands on Inventory Management', async () => {
    vi.mocked(listVehicles).mockResolvedValue([])
    signInAs(ADMIN)
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Inventory Management' })).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Find your next car' })).not.toBeInTheDocument()
  })

  it('FE-ROLE-02: a buyer who types /admin is sent to the storefront without admin controls', async () => {
    vi.mocked(listVehicles).mockResolvedValue([])
    signInAs(BUYER)
    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: 'Find your next car' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Inventory Management' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add vehicle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('FE-ROLE-03: a visitor without a session who opens /admin is sent to sign in', () => {
    renderApp('/admin')

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})
