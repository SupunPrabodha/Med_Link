import React from 'react'

export function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ')
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' },
) {
  const { className, variant = 'primary', ...rest } = props
  const base =
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900'
      : variant === 'secondary'
        ? 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 active:bg-white'
        : 'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-100'
  return <button className={cn(base, styles, className)} {...rest} />
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
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
  return <div className={cn('rounded-xl border border-slate-200 bg-white p-6', className)} {...rest} />
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
