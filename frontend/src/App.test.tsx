import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { loadSession } from './auth/session'
import { BUYER, renderApp, signInAs } from './test/renderApp'

vi.mock('./api/auth')

describe('Session and routing', () => {
  it('FE-AUTH-09: sends a visitor without a session to the login page', () => {
    renderApp('/')

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('FE-AUTH-08: logging out clears the session and returns to the login page', async () => {
    signInAs(BUYER)
    renderApp('/')
    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }))

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(loadSession()).toBeNull()
  })
})
