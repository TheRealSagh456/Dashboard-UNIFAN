import { useEffect, useId, useState, type FocusEventHandler, type KeyboardEventHandler, type MouseEventHandler, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

type AnchorRect = {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
  placement: TooltipPlacement
}

export type TooltipTriggerProps<T extends Element> = {
  tabIndex: number
  'aria-describedby': string | undefined
  onMouseEnter: MouseEventHandler<T>
  onMouseLeave: MouseEventHandler<T>
  onFocus: FocusEventHandler<T>
  onBlur: FocusEventHandler<T>
  onKeyDown: KeyboardEventHandler<T>
}

type TooltipProps<T extends Element> = {
  children: (triggerProps: TooltipTriggerProps<T>) => ReactNode
  content: ReactNode
  placement?: TooltipPlacement
  className?: string
  disabled?: boolean
}

const placementStyles: Record<TooltipPlacement, string> = {
  top: '-translate-x-1/2 -translate-y-full',
  right: 'translate-y-[-50%]',
  bottom: '-translate-x-1/2',
  left: '-translate-x-full translate-y-[-50%]',
}

function getPosition(rect: AnchorRect, placement: TooltipPlacement) {
  const offset = 10

  if (placement === 'right') {
    return { left: rect.right + offset, top: rect.top + rect.height / 2 }
  }

  if (placement === 'bottom') {
    return { left: rect.left + rect.width / 2, top: rect.bottom + offset }
  }

  if (placement === 'left') {
    return { left: rect.left - offset, top: rect.top + rect.height / 2 }
  }

  return { left: rect.left + rect.width / 2, top: rect.top - offset }
}

function resolvePlacement(rect: DOMRect, preferredPlacement: TooltipPlacement) {
  const requiredSpace = 96

  if (preferredPlacement === 'top' && rect.top < requiredSpace) return 'bottom'
  if (preferredPlacement === 'bottom' && window.innerHeight - rect.bottom < requiredSpace) return 'top'
  if (preferredPlacement === 'left' && rect.left < requiredSpace) return 'right'
  if (preferredPlacement === 'right' && window.innerWidth - rect.right < requiredSpace) return 'left'

  return preferredPlacement
}

export function Tooltip<T extends Element>({
  children,
  content,
  placement = 'top',
  className,
  disabled = false,
}: TooltipProps<T>) {
  const tooltipId = useId()
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null)

  useEffect(() => {
    if (!anchorRect) return

    const closeTooltip = () => setAnchorRect(null)
    window.addEventListener('resize', closeTooltip)
    window.addEventListener('scroll', closeTooltip, true)

    return () => {
      window.removeEventListener('resize', closeTooltip)
      window.removeEventListener('scroll', closeTooltip, true)
    }
  }, [anchorRect])

  const openTooltip = (target: T) => {
    if (disabled) return

    const rect = target.getBoundingClientRect()
    const resolvedPlacement = resolvePlacement(rect, placement)
    setAnchorRect({
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      placement: resolvedPlacement,
    })
  }

  const triggerProps: TooltipTriggerProps<T> = {
    tabIndex: disabled ? -1 : 0,
    'aria-describedby': anchorRect ? tooltipId : undefined,
    onMouseEnter: (event) => openTooltip(event.currentTarget),
    onMouseLeave: () => setAnchorRect(null),
    onFocus: (event) => openTooltip(event.currentTarget),
    onBlur: () => setAnchorRect(null),
    onKeyDown: (event) => {
      if (event.key === 'Escape') setAnchorRect(null)
    },
  }

  const resolvedPlacement = anchorRect?.placement ?? placement
  const position = anchorRect ? getPosition(anchorRect, resolvedPlacement) : null

  return (
    <>
      {children(triggerProps)}
      {position &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[100] max-w-64 rounded-xl border border-brand-200 bg-ink px-3 py-2 text-xs leading-5 text-paper shadow-soft motion-safe:animate-[rise-in_160ms_ease-out_both]',
              placementStyles[resolvedPlacement],
              className,
            )}
            style={position}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}
