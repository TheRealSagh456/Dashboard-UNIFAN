import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const buttonStyles = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'border-brand-600 bg-brand-600 text-white shadow-[0_8px_22px_rgb(169_83_31_/_0.2)] hover:-translate-y-0.5 hover:border-brand-700 hover:bg-brand-700',
        secondary:
          'border-brand-200 bg-brand-100 text-brand-800 hover:border-brand-500 hover:bg-brand-200',
        outline:
          'border-line bg-paper text-ink hover:border-brand-500 hover:text-brand-700',
        ghost:
          'border-transparent bg-transparent text-muted hover:bg-brand-50 hover:text-brand-700',
        danger:
          'border-negative bg-negative text-white hover:-translate-y-0.5 hover:brightness-90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-sm',
        icon: 'size-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & {
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
