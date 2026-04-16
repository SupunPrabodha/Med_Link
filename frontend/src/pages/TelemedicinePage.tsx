import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card } from '../ui/primitives'

type ConsultationSessionSummary = {
  sessionId: number
  appointmentId: number
  doctorUserId: number
  patientUserId: number
  roomId: string
  scheduledStartTime: string
  sessionStatus: string
  participantRole: 'DOCTOR' | 'PATIENT'
  joinable: boolean
  joinOpensAt: string
  joinClosesAt: string
}

type JoinResponse = {
  sessionId: number
  appointmentId: number
  doctorUserId: number
  patientUserId: number
  roomId: string
  meetingUrl: string
  jitsiDomain: string
  joinToken: string | null
  role: 'DOCTOR' | 'PATIENT'
  displayName: string
  scheduledStartTime: string
  tokenExpiresAt: string
  sessionStatus: string
}

type SessionFilter = 'ALL' | 'UPCOMING' | 'COMPLETED'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString()
}

function openMeetingInNewTab(meetingUrl: string) {
  window.open(meetingUrl, '_blank', 'noopener,noreferrer')
}

export function TelemedicinePage() {
  const [sessions, setSessions] = useState<ConsultationSessionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SessionFilter>('ALL')
  const [selectedSession, setSelectedSession] = useState<ConsultationSessionSummary | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ConsultationSessionSummary[]>('/telemedicine/me/sessions')
      setSessions(res.data ?? [])
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load consultations'))
    } finally {
      setLoading(false)
    }
  }

  async function joinSessionAndOpen(sessionId: number) {
    setJoiningId(sessionId)
    setJoinError(null)
    setError(null)
    try {
      const res = await api.post<JoinResponse>(`/telemedicine/sessions/${sessionId}/join`)
      openMeetingInNewTab(res.data.meetingUrl)
      setSelectedSession(null)
    } catch (err: any) {
      setJoinError(formatApiError(err, 'Failed to join consultation'))
    } finally {
      setJoiningId(null)
    }
  }

  function classifySession(session: ConsultationSessionSummary): Exclude<SessionFilter, 'ALL'> {
    const status = session.sessionStatus.toUpperCase()
    const closedByStatus = status === 'ENDED' || status === 'CANCELLED'
    const closedByTime = new Date(session.joinClosesAt).getTime() < Date.now()
    return closedByStatus || closedByTime ? 'COMPLETED' : 'UPCOMING'
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredSessions = useMemo(() => {
    if (filter === 'ALL') return sessions
    return sessions.filter((session) => classifySession(session) === filter)
  }, [sessions, filter])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Telemedicine</div>
            <div className="text-xs text-slate-500">Join a secure consultation from your confirmed appointment sessions.</div>
          </div>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
        {joinError && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{joinError}</div>}
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">My sessions</div>
            <div className="mt-1 text-xs text-slate-500">Tap a session to request join access. The meeting opens in a new browser tab after confirmation.</div>
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('UPCOMING')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'UPCOMING' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setFilter('COMPLETED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'COMPLETED' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredSessions.map((session) => {
            const completionType = classifySession(session)
            return (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => setSelectedSession(session)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:bg-slate-50"
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Consultation #{session.sessionId}</div>
                    <div className="truncate text-xs text-slate-500">Appointment {session.appointmentId} • {session.participantRole} • Room {session.roomId}</div>
                  </div>

                  <div className="grid gap-1 text-xs text-slate-600">
                    <div>Start: <span className="font-mono text-slate-900">{formatTime(session.scheduledStartTime)}</span></div>
                    <div>Window: <span className="font-mono text-slate-900">{formatTime(session.joinOpensAt)}</span> → <span className="font-mono text-slate-900">{formatTime(session.joinClosesAt)}</span></div>
                  </div>

                  <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                    <Badge>{session.sessionStatus}</Badge>
                    {completionType === 'COMPLETED' ? <Badge>Completed</Badge> : <Badge>Upcoming</Badge>}
                    {session.joinable ? <Badge>Joinable</Badge> : <Badge>Locked</Badge>}
                  </div>
                </div>
              </button>
            )
          })}

          {!loading && filteredSessions.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No sessions found for this filter.
            </div>
          )}
        </div>

        {!loading && sessions.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No consultation sessions yet. Once an appointment is confirmed, a session will appear here.
          </div>
        )}
      </Card>

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="text-base font-semibold text-slate-900">Join consultation</div>
            <div className="mt-2 text-sm text-slate-600">Would you like to join this meeting?</div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div>Session: <span className="font-mono text-slate-900">#{selectedSession.sessionId}</span></div>
              <div className="mt-1">Room: <span className="font-mono text-slate-900">{selectedSession.roomId}</span></div>
              <div className="mt-1">Start: <span className="font-mono text-slate-900">{formatTime(selectedSession.scheduledStartTime)}</span></div>
            </div>

            {!selectedSession.joinable && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                This session is currently locked. You can join only inside the allowed time window.
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedSession(null)}>
                No
              </Button>
              <Button
                onClick={() => void joinSessionAndOpen(selectedSession.sessionId)}
                disabled={!selectedSession.joinable || joiningId === selectedSession.sessionId}
              >
                {joiningId === selectedSession.sessionId ? 'Joining…' : 'Yes, join'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}