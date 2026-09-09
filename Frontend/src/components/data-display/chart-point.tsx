import { cva, type VariantProps } from 'class-variance-authority'
import type { SVGAttributes } from 'react'
import { cn } from '../../lib/cn'

const pointStyles = cva(
  'cursor-default stroke-paper stroke-[3] transition duration-200 hover:stroke-brand-200 focus-visible:outline-none focus-visible:stroke-ink',
  {
    variants: {
      tone: {
        brand: 'fill-brand-600',
        soft: 'fill-brand-200',
        positive: 'fill-positive',
        muted: 'fill-muted',
      },
    },
    defaultVariants: {
      tone: 'brand',
    },
  },
)

const pointRadius = {
  sm: 4,
  md: 6,
  lg: 8,
}

type ChartPointProps = Omit<SVGAttributes<SVGCircleElement>, 'cx' | 'cy'> &
  VariantProps<typeof pointStyles> & {
    x: number
    y: number
    size?: keyof typeof pointRadius
  }

export function ChartPoint({ x, y, tone, size = 'md', className, ...props }: ChartPointProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={pointRadius[size]}
      className={cn(pointStyles({ tone }), className)}
      {...props}
    />
  )
}
