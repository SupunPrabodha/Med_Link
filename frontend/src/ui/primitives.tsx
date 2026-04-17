import React from 'react'

export function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ')
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' },
) {
  const { className, variant = 'primary', ...rest } = props
  const base =
    'inline-flex h-10 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)] focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'
      : variant === 'secondary'
        ? 'border border-sky-100 bg-white text-slate-700 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 hover:-translate-y-0.5'
        : variant === 'danger'
          ? 'border border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100 hover:text-rose-800 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2'
        : 'bg-transparent text-slate-600 hover:bg-sky-50 hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'
  return <button className={cn(base, styles, className)} {...rest} />
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...rest}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...rest}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props
  return (
    <select
      className={cn(
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...rest}
    />
  )
}

export function Alert(
  props: React.HTMLAttributes<HTMLDivElement> & { tone?: 'info' | 'success' | 'warning' | 'error' },
) {
  const { className, tone = 'info', ...rest } = props

  const toneStyles =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-800 shadow-sm'
          : 'border-sky-100 bg-sky-50 text-sky-800 shadow-sm'

  return <div className={cn('rounded-xl border p-4 text-sm font-medium', toneStyles, className)} {...rest} />
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { className, ...rest } = props
  return <label className={cn('text-sm font-semibold text-slate-700', className)} {...rest} />
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn('hospital-panel p-5 sm:p-7', className)} {...rest} />
}

export function Badge(props: React.HTMLAttributes<HTMLSpanElement>) {
  const { className, ...rest } = props
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border border-sky-100 bg-sky-50/70 px-2.5 py-1 text-xs font-bold tracking-wide text-sky-800 shadow-sm',
        className,
      )}
      {...rest}
    />
  )
}

export function Divider() {
  return <div className="h-px w-full bg-slate-100" />
}

export function PageHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: React.ReactNode
  description: React.ReactNode
  actions?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div
      className="mb-6 rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg,#0c1a2e,#0f3460)',
        boxShadow: '0 8px 32px rgba(14,165,233,0.18)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-sm backdrop-blur-md">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <p className="mt-1 text-sm text-sky-200/70">{description}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
