import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Alert, Button, cn } from './primitives'

type ToastTone = 'info' | 'success' | 'warning' | 'error'

type ToastItem = {
  id: string
  tone: ToastTone
  message: string
  durationMs: number
}

type ToastContextValue = {
  push: (tone: ToastTone, message: string, opts?: { durationMs?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function randomId() {
  // reasonably unique for UI purposes
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id)
    if (t) window.clearTimeout(t)
    timersRef.current.delete(id)
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, message: string, opts?: { durationMs?: number }) => {
      const id = randomId()
      const durationMs = Math.max(1500, Math.min(10_000, opts?.durationMs ?? 4500))

      const item: ToastItem = { id, tone, message, durationMs }
      setToasts((prev) => [item, ...prev].slice(0, 5))

      const timer = window.setTimeout(() => dismiss(id), durationMs)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Alert tone={t.tone} className={cn('flex items-start justify-between gap-3')}
            >
              <div className="min-w-0 flex-1 break-words">{t.message}</div>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 shrink-0 rounded-lg px-0"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')

  return {
    info: (message: string, opts?: { durationMs?: number }) => ctx.push('info', message, opts),
    success: (message: string, opts?: { durationMs?: number }) => ctx.push('success', message, opts),
    warning: (message: string, opts?: { durationMs?: number }) => ctx.push('warning', message, opts),
    error: (message: string, opts?: { durationMs?: number }) => ctx.push('error', message, opts),
  }
}
