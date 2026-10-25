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
    expect(screen.getByLabelText('Email')).toHaveValue('buyer@dealership.com')
    expect(loadSession()).toBeNull()
  })

  it('FE-AUTH-11: shows the Masar Auto brand panel and the sign-in copy', () => {
    renderApp('/login')

    expect(screen.getByRole('img', { name: 'Masar Auto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Sign in to continue to your account.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password')
  })

  it('FE-AUTH-12: the password visibility toggle shows and hides the password', async () => {
    renderApp('/login')
    const user = userEvent.setup()
    const password = screen.getByLabelText('Password')
    await user.type(password, 'Secr3t-pass')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveValue('Secr3t-pass')
  })

  it('FE-AUTH-13: disables Sign in while the request is in flight', async () => {
    vi.mocked(login).mockReturnValue(new Promise(() => {}))
    renderApp('/login')

    await submitLogin('buyer@dealership.com', 'Secr3t-pass')

    const button = screen.getByRole('button', { name: 'Signing in…' })
    expect(button).toBeDisabled()
    await userEvent.setup().click(button)
    expect(login).toHaveBeenCalledTimes(1)
  })

  it('FE-AUTH-14: "Create an account" opens registration, and "Sign in" comes back', async () => {
    renderApp('/login')
    const user = userEvent.setup()

    await user.click(screen.getByRole('link', { name: 'Create an account' }))
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})
