import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { login } from '../api/auth'
import { ApiError } from '../api/client'
import { loadSession } from '../auth/session'
import { BUYER, renderApp } from '../test/renderApp'

vi.mock('../api/auth')

async function submitLogin(email: string, password: string) {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText('Email'), email)
  if (password) await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('Login page', () => {
  it('FE-AUTH-01: asks for both fields and does not call the API when empty', async () => {
    renderApp('/login')

    await submitLogin('', '')

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('FE-AUTH-02: rejects an invalid email without calling the API', async () => {
    renderApp('/login')

    await submitLogin('not-an-email', 'Secr3t-pass')

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('FE-AUTH-03: signs in, stores the session and opens the inventory', async () => {
    vi.mocked(login).mockResolvedValue({ access_token: 'jwt', token_type: 'bearer', user: BUYER })
    renderApp('/login')

    await submitLogin('buyer@dealership.com', 'Secr3t-pass')

    expect(login).toHaveBeenCalledWith('buyer@dealership.com', 'Secr3t-pass')
    expect(await screen.findByRole('heading', { name: 'Find your next car' })).toBeInTheDocument()
    expect(loadSession()).toEqual({ token: 'jwt', user: BUYER })
  })

  it('FE-AUTH-04: shows the server error and stays on the login page', async () => {
    vi.mocked(login).mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    renderApp('/login')

    await submitLogin('buyer@dealership.com', 'wrong-pass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(loadSession()).toBeNull()
  })
})
