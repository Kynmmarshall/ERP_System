import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`h-11 w-full rounded-md border bg-surface px-3 text-sm text-text placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
        hasError ? 'border-error' : 'border-border focus:border-primary/60'
      } ${className}`}
      aria-invalid={hasError || undefined}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
