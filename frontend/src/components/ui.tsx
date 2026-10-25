import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong disabled:bg-hairline disabled:text-muted',
  dark: 'bg-ink text-white hover:bg-graphite disabled:bg-hairline disabled:text-muted',
  secondary: 'border border-line bg-surface text-ink hover:border-muted disabled:text-muted',
  ghost: 'text-ink hover:bg-hairline disabled:text-muted',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:bg-hairline disabled:text-muted',
  'danger-ghost': 'text-danger hover:bg-danger-soft disabled:text-muted',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  )
}

const LABEL = 'text-[13px] font-medium text-graphite'
const CONTROL =
  'h-10 w-full min-w-0 rounded border bg-surface px-3 text-sm text-ink placeholder:text-muted/70 transition-colors'

/** Links a field's validation message (or hint) to it for screen readers. */
function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  const message = error ?? hint
  if (!message) return null
  return (
    <p id={id} className={`text-xs ${error ? 'font-medium text-danger' : 'text-muted'}`}>
      {message}
    </p>
  )
}

/** A labelled input with its validation message linked for screen readers. */
export function TextField({
  label,
  error,
  hint,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId()
  const messageId = `${id}-message`
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={`${CONTROL} ${error ? 'border-danger' : 'border-line hover:border-muted'}`}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  )
}

/** A labelled native select, styled like the text fields. */
export function SelectField({
  label,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId()
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select id={id} className={`${CONTROL} border-line pr-8 hover:border-muted`} {...props}>
        {children}
      </select>
    </div>
  )
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-danger/25 bg-danger-soft text-danger',
    success: 'border-success/25 bg-success-soft text-success',
    info: 'border-accent/25 bg-accent/5 text-graphite',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  )
}

export function Wordmark({ className = 'text-ink' }: { className?: string }) {
  return (
    <span className={`text-[13px] font-semibold tracking-[0.32em] whitespace-nowrap uppercase ${className}`}>
      Dealership
    </span>
  )
}
