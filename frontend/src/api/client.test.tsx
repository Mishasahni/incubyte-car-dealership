import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadSession } from '../auth/session'
import { BUYER, renderApp, signInAs } from '../test/renderApp'

describe('Expired session', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('FE-AUTH-10: a 401 from the API signs the user out with a notice', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    signInAs(BUYER)

    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument()
    expect(loadSession()).toBeNull()
  })
})
