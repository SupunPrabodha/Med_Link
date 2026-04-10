import React from 'react'

export function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ')
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' },
) {
  const { className, variant = 'primary', ...rest } = props
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const styles =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-800'
      : variant === 'secondary'
        ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
        : 'bg-transparent text-slate-700 hover:bg-slate-100'
  return <button className={cn(base, styles, className)} {...rest} />
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100',
        className,
      )}
      {...rest}
    />
  )
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { className, ...rest } = props
  return <label className={cn('text-sm font-medium text-slate-700', className)} {...rest} />
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn('rounded-xl border border-slate-200 bg-white p-5', className)} {...rest} />
}

export function Badge(props: React.HTMLAttributes<HTMLSpanElement>) {
  const { className, ...rest } = props
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700',
        className,
      )}
      {...rest}
    />
  )
}

export function Divider() {
  return <div className="h-px w-full bg-slate-200" />
}
