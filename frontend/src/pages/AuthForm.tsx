import { useState, type FormEvent, type ReactNode } from 'react'

import { ApiError } from '../api/client'
import { validateCredentials, type CredentialErrors } from '../auth/validation'
import { Alert, Button, TextField, Wordmark } from '../components/ui'

interface AuthFormProps {
  title: string
  subtitle: string
  submitLabel: string
  enforcePasswordPolicy: boolean
  notice?: string | null
  onSubmit: (email: string, password: string) => Promise<void>
  footer: ReactNode
}

/** Shared sign-in / registration form: validates locally, then shows the server's message. */
export function AuthForm({ title, subtitle, submitLabel, enforcePasswordPolicy, notice, onSubmit, footer }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<CredentialErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setServerError(null)
    const found = validateCredentials(email, password, { enforcePolicy: enforcePasswordPolicy })
    setErrors(found)
    if (found.email || found.password) return

    setSubmitting(true)
    try {
      await onSubmit(email.trim(), password)
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Wordmark />
      <div className="w-full max-w-sm rounded bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{subtitle}</p>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          {notice && <Alert tone="info">{notice}</Alert>}
          {serverError && <Alert>{serverError}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete={enforcePasswordPolicy ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            hint={enforcePasswordPolicy ? '8–128 characters' : undefined}
          />
          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? 'Please wait…' : submitLabel}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">{footer}</p>
      </div>
    </main>
  )
}
