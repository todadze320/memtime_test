import type { ReactNode } from 'react'

type AlertProps = {
  variant: 'success' | 'error' | 'info'
  title?: string
  children: ReactNode
  onDismiss?: () => void
}

export function Alert({ variant, title, children, onDismiss }: AlertProps) {
  return (
    <div className={`alert alert--${variant}`} role="alert">
      <div className="alert__body">
        {title ? <strong className="alert__title">{title}</strong> : null}
        <div>{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
