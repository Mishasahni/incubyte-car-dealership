import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'outline' | 'secondary' | 'ghost' | 'danger'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong disabled:bg-raised disabled:text-silver',
  // Repeated row actions use the accent as an outline so the page keeps one strong action.
  outline:
    'border border-accent/60 text-mist hover:border-accent hover:bg-accent hover:text-white disabled:border-line disabled:bg-transparent disabled:text-silver',
  secondary: 'border border-line bg-raised text-mist hover:border-silver/60 disabled:text-silver/60',
  ghost: 'text-silver hover:text-mist disabled:text-silver/50',
  danger: 'bg-danger text-white hover:bg-danger/85 disabled:bg-raised disabled:text-silver',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
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
  const message = error ?? hint
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-silver uppercase">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={`h-10 rounded-md border bg-ink px-3 text-sm text-mist placeholder:text-silver/50 ${
          error ? 'border-danger' : 'border-line hover:border-silver/50'
        }`}
        {...props}
      />
      {message && (
        <p id={messageId} className={`text-xs ${error ? 'text-danger' : 'text-silver'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-danger/40 bg-danger/10 text-mist',
    success: 'border-success/40 bg-success/10 text-mist',
    info: 'border-line bg-raised text-mist',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export function Wordmark() {
  return (
    <span className="text-sm font-semibold tracking-[0.18em] text-mist uppercase">
      Dealership <span className="text-silver">Inventory</span>
    </span>
  )
}
