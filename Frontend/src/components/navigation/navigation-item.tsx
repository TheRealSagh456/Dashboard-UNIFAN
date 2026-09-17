import type { LucideIcon } from 'lucide-react'
import type { AnchorHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type NavigationItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  label: string
  icon: LucideIcon
  active?: boolean
  count?: number
  collapsed?: boolean
  disabled?: boolean
}

export function NavigationItem({
  label,
  icon: Icon,
  active = false,
  count,
  collapsed = false,
  disabled = false,
  className,
  onClick,
  ...props
}: NavigationItemProps) {
  return (
    <a
      className={cn(
        'group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        active && 'bg-brand-100 text-brand-800',
        collapsed && 'justify-center px-0',
        disabled && 'cursor-not-allowed opacity-45 hover:bg-transparent hover:text-muted',
        className,
      )}
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      aria-label={collapsed ? label : undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(event) => {
        if (disabled) event.preventDefault()
        onClick?.(event)
      }}
      {...props}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn('flex-1', collapsed && 'sr-only')}>{label}</span>
      {count !== undefined && !collapsed && (
        <span className="rounded-full bg-paper px-2 py-0.5 text-[0.65rem] font-bold tabular-nums text-brand-700">
          {count}
        </span>
      )}
    </a>
  )
}
