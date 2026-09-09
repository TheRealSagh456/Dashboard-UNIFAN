import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '../../lib/cn'
import { Text } from './typography'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string
  hint?: string
  error?: string
  leadingIcon?: ReactNode
}

export function TextField({
  id,
  label,
  hint,
  error,
  leadingIcon,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`

  return (
    <label htmlFor={inputId} className="grid gap-1.5">
      {label && <Text variant="label">{label}</Text>}
      <span className="relative block">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none transition placeholder:text-muted/65 focus:border-brand-500 focus:ring-3 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
            leadingIcon && 'pl-10',
            error && 'border-negative focus:border-negative focus:ring-negative/10',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          {...props}
        />
      </span>
      {(error || hint) && (
        <Text
          id={messageId}
          as="span"
          variant="caption"
          tone={error ? 'negative' : 'muted'}
        >
          {error ?? hint}
        </Text>
      )}
    </label>
  )
}
