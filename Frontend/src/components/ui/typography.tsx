import { cva, type VariantProps } from 'class-variance-authority'
import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const textStyles = cva('', {
  variants: {
    variant: {
      display: 'font-display text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl',
      h1: 'font-display text-4xl leading-tight tracking-[-0.025em] sm:text-5xl',
      h2: 'font-display text-3xl leading-tight tracking-[-0.02em]',
      h3: 'font-display text-xl leading-snug',
      body: 'text-sm leading-6',
      label: 'text-sm font-semibold leading-5',
      caption: 'text-xs leading-5',
      eyebrow: 'text-[0.68rem] font-bold uppercase leading-4 tracking-[0.18em]',
      data: 'font-display text-3xl leading-none tabular-nums',
    },
    tone: {
      default: 'text-ink',
      muted: 'text-muted',
      accent: 'text-brand-700',
      inverse: 'text-paper',
      positive: 'text-positive',
      negative: 'text-negative',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
  },
})

type TextProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof textStyles> & {
    as?: ElementType
  }

export function Text({
  as: Component = 'p',
  variant,
  tone,
  className,
  ...props
}: TextProps) {
  return <Component className={cn(textStyles({ variant, tone }), className)} {...props} />
}
