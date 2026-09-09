import { cva, type VariantProps } from 'class-variance-authority'
import type { SVGAttributes } from 'react'
import { cn } from '../../lib/cn'

const sectorStyles = cva(
  'cursor-default stroke-paper stroke-[2] transition duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:stroke-ink focus-visible:stroke-[3]',
  {
    variants: {
      tone: {
        brand: 'fill-brand-700',
        warm: 'fill-brand-500',
        soft: 'fill-brand-200',
        positive: 'fill-positive',
        muted: 'fill-muted/55',
      },
    },
    defaultVariants: {
      tone: 'brand',
    },
  },
)

type Point = {
  x: number
  y: number
}

function polarPoint(center: number, radius: number, angle: number): Point {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  }
}

function describeSector(
  startAngle: number,
  endAngle: number,
  outerRadius: number,
  innerRadius: number,
  center: number,
) {
  const outerStart = polarPoint(center, outerRadius, startAngle)
  const outerEnd = polarPoint(center, outerRadius, endAngle)
  const innerEnd = polarPoint(center, innerRadius, endAngle)
  const innerStart = polarPoint(center, innerRadius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

type ChartSectorProps = Omit<SVGAttributes<SVGPathElement>, 'd'> &
  VariantProps<typeof sectorStyles> & {
    startAngle: number
    endAngle: number
    outerRadius?: number
    innerRadius?: number
    center?: number
  }

export function ChartSector({
  startAngle,
  endAngle,
  outerRadius = 82,
  innerRadius = 50,
  center = 100,
  tone,
  className,
  ...props
}: ChartSectorProps) {
  return (
    <path
      d={describeSector(startAngle, endAngle, outerRadius, innerRadius, center)}
      className={cn(sectorStyles({ tone }), className)}
      {...props}
    />
  )
}
