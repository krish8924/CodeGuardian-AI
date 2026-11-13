import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FormFieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-relaxed text-slate-600">{hint}</p>
      ) : null}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  leadingIcon?: ReactNode
}

export function Input({ className, invalid, leadingIcon, ...props }: InputProps) {
  const fallbackId = useId()
  const inputId = props.id ?? fallbackId

  const input = (
    <input
      id={inputId}
      className={cn(
        'h-10 w-full rounded-lg border border-line bg-canvas/80 px-3.5 text-sm text-slate-100 shadow-sm outline-none transition-colors',
        'placeholder:text-slate-600',
        'focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10',
        'disabled:cursor-not-allowed disabled:opacity-60',
        leadingIcon ? 'pl-10' : null,
        invalid ? 'border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/10' : null,
        className,
      )}
      {...props}
    />
  )

  if (!leadingIcon) return input

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-500">
        {leadingIcon}
      </span>
      {input}
    </div>
  )
}
