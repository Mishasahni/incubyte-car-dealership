import { useId, useState, type InputHTMLAttributes } from 'react'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }

const INPUT =
  'h-11 w-full min-w-0 rounded border bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/60 transition-colors motion-reduce:transition-none'

/** Label, input and a linked message: the shape both authentication fields share. */
function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (ids: { id: string; describedBy?: string }) => React.ReactNode }) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-graphite">
        {label}
      </label>
      {children({ id, describedBy: message ? messageId : undefined })}
      {message && (
        <p id={messageId} className={`text-xs ${error ? 'font-medium text-danger' : 'text-muted'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

export function AuthTextField({ label, error, hint, ...props }: FieldProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${INPUT} ${error ? 'border-danger' : 'border-line hover:border-muted'}`}
          {...props}
        />
      )}
    </Field>
  )
}

/** A password input with a button that shows or hides what was typed. */
export function PasswordField({ label, error, hint, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy }) => (
        <div className="relative">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${INPUT} pr-12 ${error ? 'border-danger' : 'border-line hover:border-muted'}`}
            {...props}
          />
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r text-muted hover:text-ink"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>
      )}
    </Field>
  )
}
