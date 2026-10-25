import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** "panel" slides in from the right (full screen on phones); "dialog" is a small centred box. */
  variant?: 'panel' | 'dialog'
  role?: 'dialog' | 'alertdialog'
  description?: string
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Accessible modal: labelled, closes on Escape, keeps focus inside, restores focus on close. */
export function Modal({ title, onClose, children, variant = 'dialog', role = 'dialog', description }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    boxRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !boxRef.current) return
    const focusable = Array.from(boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const layout =
    variant === 'panel'
      ? 'fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[28rem] sm:border-l'
      : 'fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border'

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleKeyDown}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={boxRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`${layout} flex flex-col overflow-y-auto border-line bg-panel p-6 shadow-2xl shadow-black/40`}
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-1 text-sm text-silver">
            {description}
          </p>
        )}
        <div className="mt-5 flex-1">{children}</div>
      </div>
    </div>
  )
}
