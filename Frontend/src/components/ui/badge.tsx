import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const badgeStyles = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em]',
  {
    variants: {
      tone: {
        neutral: 'border-line bg-surface text-muted',
        brand: 'border-brand-200 bg-brand-100 text-brand-800',
        positive: 'border-positive/20 bg-positive/10 text-positive',
        warning: 'border-warning/20 bg-warning/10 text-warning',
        negative: 'border-negative/20 bg-negative/10 text-negative',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeStyles>

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badgeStyles({ tone }), className)} {...props} />
}
