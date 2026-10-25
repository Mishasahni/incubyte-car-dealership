import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { login, register } from '../api/auth'
import { ApiError } from '../api/client'
import { BUYER, renderApp } from '../test/renderApp'

vi.mock('../api/auth')

async function submitRegistration(email: string, password: string) {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText('Email'), email)
  if (password) await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('Register page', () => {
  it('FE-AUTH-05: validates input without calling the API and offers no role choice', async () => {
    renderApp('/register')

    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument()

    await submitRegistration('', '')
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()

    await submitRegistration('buyer@dealership.com', '7chars!')
    expect(screen.getByText('Password must be 8–128 characters')).toBeInTheDocument()

    expect(register).not.toHaveBeenCalled()
  })

  it('FE-AUTH-06: registers, signs in automatically and opens the inventory', async () => {
    vi.mocked(register).mockResolvedValue(BUYER)
    vi.mocked(login).mockResolvedValue({ access_token: 'jwt', token_type: 'bearer', user: BUYER })
    renderApp('/register')

    await submitRegistration('buyer@dealership.com', 'Secr3t-pass')

    expect(register).toHaveBeenCalledWith('buyer@dealership.com', 'Secr3t-pass')
    expect(login).toHaveBeenCalledWith('buyer@dealership.com', 'Secr3t-pass')
    expect(await screen.findByRole('heading', { name: 'Find your next car' })).toBeInTheDocument()
  })

  it('FE-AUTH-07: shows that the email is already registered', async () => {
    vi.mocked(register).mockRejectedValue(new ApiError(409, 'Email already registered'))
    renderApp('/register')

    await submitRegistration('buyer@dealership.com', 'Secr3t-pass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered')
    expect(login).not.toHaveBeenCalled()
  })

  it('FE-AUTH-15: shows the companion layout, the real password rule and a toggle', async () => {
    renderApp('/register')

    expect(screen.getByRole('img', { name: 'Masar Auto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByText('8–128 characters')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })

  it('FE-AUTH-16: disables Create account while the request is in flight', async () => {
    vi.mocked(register).mockReturnValue(new Promise(() => {}))
    renderApp('/register')

    await submitRegistration('buyer@dealership.com', 'Secr3t-pass')

    expect(screen.getByRole('button', { name: 'Creating account…' })).toBeDisabled()
    expect(register).toHaveBeenCalledTimes(1)
  })
})
