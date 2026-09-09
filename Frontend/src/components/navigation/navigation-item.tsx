import type { LucideIcon } from 'lucide-react'
import type { AnchorHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type NavigationItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  label: string
  icon: LucideIcon
  active?: boolean
  count?: number
}

export function NavigationItem({
  label,
  icon: Icon,
  active = false,
  count,
  className,
  ...props
}: NavigationItemProps) {
  return (
    <a
      className={cn(
        'group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        active && 'bg-brand-100 text-brand-800',
        className,
      )}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-paper px-2 py-0.5 text-[0.65rem] font-bold tabular-nums text-brand-700">
          {count}
        </span>
      )}
    </a>
  )
}
