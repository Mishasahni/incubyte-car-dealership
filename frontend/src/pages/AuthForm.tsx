import { useState, type FormEvent, type ReactNode } from 'react'

import { ApiError } from '../api/client'
import { validateCredentials, type CredentialErrors } from '../auth/validation'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthTextField, PasswordField } from '../components/auth/fields'
import { Alert } from '../components/ui'

interface AuthFormProps {
  title: string
  subtitle: string
  submitLabel: string
  pendingLabel: string
  enforcePasswordPolicy: boolean
  notice?: string | null
  onSubmit: (email: string, password: string) => Promise<void>
  footer: ReactNode
}

/** Shared sign-in / registration form: validates locally, then shows the server's message. */
export function AuthForm({ title, subtitle, submitLabel, pendingLabel, enforcePasswordPolicy, notice, onSubmit, footer }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<CredentialErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
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
    <AuthLayout>
      <p className="text-[11px] font-semibold tracking-[0.32em] text-ink uppercase">Masar Auto</p>
      <h1 className="mt-8 text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-[15px] text-muted">{subtitle}</p>
      <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {notice && <Alert tone="info">{notice}</Alert>}
        {serverError && <Alert>{serverError}</Alert>}
        <AuthTextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          autoComplete={enforcePasswordPolicy ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          hint={enforcePasswordPolicy ? '8–128 characters' : undefined}
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex h-12 w-full items-center justify-center gap-3 rounded bg-ink text-[15px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-muted motion-reduce:transition-none"
        >
          {submitting ? pendingLabel : submitLabel}
          {!submitting && (
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 8h11M9 4l4 4-4 4" />
            </svg>
          )}
        </button>
      </form>
      <p className="mt-8 text-sm text-muted">{footer}</p>
    </AuthLayout>
  )
}
