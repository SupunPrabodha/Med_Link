import { useEffect, useState } from 'react'
import { Video, MicOff, Wifi, CheckCircle } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'

type Session = {
  appointmentId: number
  slotTime: string
  roomName: string
  joinUrl: string
  status: string
}

export function TelemedicinePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const { user } = useAuth()
  const nav = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const isDoctor = user?.roles?.includes('DOCTOR') ?? false

  useEffect(() => {
    if (!appointmentId) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Session>(`/telemedicine/sessions/appointment/${appointmentId}`)
      setSession(res.data)
      if (res.data.status === 'COMPLETED') setCompleted(true)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load telemedicine session'))
    } finally {
      setLoading(false)
    }
  }

  async function markComplete() {
    if (!appointmentId) return
    setCompleting(true)
    setError(null)
    try {
      await api.post(`/telemedicine/sessions/appointment/${appointmentId}/complete`)
      setCompleted(true)
      setSession((s) => s ? { ...s, status: 'COMPLETED' } : s)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to complete consultation'))
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />
          <p className="text-sm text-slate-500">Connecting to session…</p>
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="mb-2 font-semibold">Session unavailable</div>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => nav(-1)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          ← Back to appointments
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ─── Header card ──────────────────────────────────────────── */}
      <div className="video-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {completed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  ✓ Consultation completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-300">
                  <span className="pulse-dot" />
                  Session Active
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">
              Video Consultation — Appointment #{session?.appointmentId}
            </h1>
            {session && (
              <p className="mt-1 text-sm text-sky-200/70">
                Scheduled: {new Date(session.slotTime).toLocaleString()} &nbsp;•&nbsp;
                Room: <span className="font-mono text-sky-300">{session.roomName}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isDoctor && !completed && (
              <button
                onClick={markComplete}
                disabled={completing}
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {completing ? 'Completing…' : '✓ End Consultation'}
              </button>
            )}
            <button
              onClick={() => nav(-1)}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ─── Instructions strip ────────────────────────────────────── */}
      {!completed && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-sky-700">
            <Video className="h-4 w-4" /> Allow camera &amp; microphone when prompted
          </div>
          <span className="text-sky-200 hidden sm:block">|</span>
          <div className="flex items-center gap-2 text-sm text-sky-700">
            <MicOff className="h-4 w-4" /> Mute yourself when not speaking
          </div>
          <span className="text-sky-200 hidden sm:block">|</span>
          <div className="flex items-center gap-2 text-sm text-sky-700">
            <Wifi className="h-4 w-4" /> Ensure a stable internet connection
          </div>
        </div>
      )}

      {/* ─── Embedded Jitsi iFrame ─────────────────────────────────── */}
      {session && !completed && (
        <div
          className="overflow-hidden rounded-2xl border border-sky-100"
          style={{ boxShadow: '0 8px 40px rgba(14,165,233,0.12)' }}
        >
          <iframe
            id="jitsi-video-frame"
            src={session.joinUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: '100%', height: '600px', border: 'none', background: '#0c1a2e' }}
            title="MediLink Video Consultation"
          />
        </div>
      )}

      {/* ─── Completed state ───────────────────────────────────────── */}
      {completed && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100/50">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-emerald-800">Consultation Completed</h2>
          <p className="mb-6 text-sm text-emerald-600">
            The telemedicine session for appointment #{session?.appointmentId} has been marked as completed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {isDoctor && (
              <button
                onClick={() => nav('/app/doctor/prescriptions')}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}
              >
                Issue Prescription →
              </button>
            )}
            <button
              onClick={() => nav(isDoctor ? '/app/doctor/appointments' : '/app/appointments')}
              className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              View Appointments
            </button>
          </div>
        </div>
      )}

      {/* ─── Direct link fallback ──────────────────────────────────── */}
      {session && !completed && (
        <p className="text-center text-xs text-slate-400">
          Video not loading?{' '}
          <a
            href={session.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 underline"
          >
            Open in new tab
          </a>
        </p>
      )}
    </div>
  )
}
