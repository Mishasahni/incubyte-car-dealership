import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Each test starts with an empty page, no stored session and fresh mocks.
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})
