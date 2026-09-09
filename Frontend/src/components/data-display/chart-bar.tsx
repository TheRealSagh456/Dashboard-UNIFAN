import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Text } from '../ui/typography'

const barStyles = cva('rounded-full transition-all duration-500 ease-out', {
  variants: {
    tone: {
      brand: 'bg-gradient-to-r from-brand-500 to-brand-700',
      soft: 'bg-brand-200',
      positive: 'bg-positive',
      muted: 'bg-muted/45',
    },
  },
  defaultVariants: {
    tone: 'brand',
  },
})

type ChartBarProps = VariantProps<typeof barStyles> & {
  label: string
  value: number
  orientation?: 'horizontal' | 'vertical'
  className?: string
  barProps?: HTMLAttributes<HTMLDivElement>
}

export function ChartBar({
  label,
  value,
  orientation = 'horizontal',
  tone,
  className,
  barProps,
}: ChartBarProps) {
  const safeValue = Math.min(100, Math.max(0, value))
  const { className: barClassName, ...resolvedBarProps } = barProps ?? {}

  if (orientation === 'vertical') {
    return (
      <div
        className={cn('flex min-w-12 flex-1 flex-col items-center gap-2', className)}
        aria-label={`${label}: ${safeValue}%`}
      >
        <Text as="span" variant="caption" className="font-semibold tabular-nums">
          {safeValue}%
        </Text>
        <div className="flex h-36 w-full max-w-12 items-end rounded-t-xl bg-brand-50">
          <div
            {...resolvedBarProps}
            className={cn(
              'chart-bar-rise-vertical w-full rounded-b-none rounded-t-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              barStyles({ tone }),
              barClassName,
            )}
            style={{ height: `${safeValue}%` }}
            aria-label={`${label}: ${safeValue}%`}
          />
        </div>
        <Text as="span" variant="caption" tone="muted" className="text-center">
          {label}
        </Text>
      </div>
    )
  }

  return (
    <div
      className={cn('grid grid-cols-[minmax(5rem,0.85fr)_2fr_auto] items-center gap-3', className)}
      aria-label={`${label}: ${safeValue}%`}
    >
      <Text as="span" variant="caption" className="truncate font-medium">
        {label}
      </Text>
      <div className="h-2.5 overflow-hidden rounded-full bg-brand-50">
        <div
          {...resolvedBarProps}
          className={cn(
            'chart-bar-rise-horizontal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            barStyles({ tone }),
            barClassName,
          )}
          style={{ width: `${safeValue}%`, height: '100%' }}
          aria-label={`${label}: ${safeValue}%`}
        />
      </div>
      <Text as="span" variant="caption" tone="muted" className="w-9 text-right tabular-nums">
        {safeValue}%
      </Text>
    </div>
  )
}
