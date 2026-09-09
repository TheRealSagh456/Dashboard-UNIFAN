import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const cardStyles = cva('rounded-2xl border', {
  variants: {
    variant: {
      elevated: 'border-white/80 bg-paper shadow-card',
      outline: 'border-line bg-paper/65',
      tinted: 'border-brand-200/70 bg-brand-50/70',
      interactive:
        'border-line bg-paper shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    },
  },
  defaultVariants: {
    variant: 'elevated',
    padding: 'md',
  },
})

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardStyles>

export function Card({ variant, padding, className, ...props }: CardProps) {
  return <div className={cn(cardStyles({ variant, padding }), className)} {...props} />
}
