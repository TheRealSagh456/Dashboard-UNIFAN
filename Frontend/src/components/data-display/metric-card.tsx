import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../ui/card'
import { Text } from '../ui/typography'

type MetricCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  value: string | string[]
  change?: string
  icon?: LucideIcon
  tone?: 'brand' | 'positive' | 'warning'
}

const iconTones = {
  brand: 'bg-brand-100 text-brand-700',
  positive: 'bg-positive/10 text-positive',
  warning: 'bg-warning/10 text-warning',
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone = 'brand',
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card
      variant="outline"
      padding="sm"
      className={cn('flex min-w-0 items-center gap-3', className)}
      {...props}
    >
      {Icon && (
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', iconTones[tone])}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          {Array.isArray(value) ? (
            <ul className="min-w-0 max-w-full space-y-1 text-sm font-semibold leading-5 [overflow-wrap:anywhere]">
              {value.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          ) : (
            <Text as="strong" variant={value.length > 22 ? "label" : "data"} className={cn('block max-w-full whitespace-normal [overflow-wrap:anywhere]', value.length > 22 ? 'text-sm leading-5' : 'text-2xl')}>
              {value}
            </Text>
          )}
          {change && (
            <Text as="span" variant="caption" tone="positive" className="font-semibold">
              {change}
            </Text>
          )}
        </div>
        <Text variant="caption" tone="muted" className="mt-1 truncate">
          {label}
        </Text>
      </div>
    </Card>
  )
}
