import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-background hover:bg-primary/90 focus-visible:outline-primary',
  secondary:
    'bg-surface-elevated text-text border border-border hover:border-primary/40 focus-visible:outline-primary',
  ghost: 'text-muted hover:text-text hover:bg-surface-elevated/60 focus-visible:outline-primary',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
}

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant
  size?: Size
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, disabled, className = '', children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12 }}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'
