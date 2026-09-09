import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

type StepperProps = {
  steps: string[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-start', className)} aria-label="Progresso">
      {steps.map((step, index) => {
        const number = index + 1
        const isComplete = number < currentStep
        const isCurrent = number === currentStep

        return (
          <li key={step} className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {index < steps.length - 1 && (
              <span
                className={cn(
                  'absolute left-1/2 top-3 h-px w-full bg-line transition-colors',
                  isComplete && 'bg-brand-500',
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-6 place-items-center rounded-full border border-line bg-paper text-[0.65rem] font-bold text-muted transition',
                isCurrent && 'border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100',
                isComplete && 'border-brand-500 bg-brand-100 text-brand-700',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isComplete ? <Check className="size-3.5" aria-hidden="true" /> : number}
            </span>
            <span
              className={cn(
                'relative z-10 max-w-20 text-[0.68rem] font-medium text-muted',
                isCurrent && 'font-bold text-ink',
              )}
            >
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
