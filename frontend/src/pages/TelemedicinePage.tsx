import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card } from '../ui/primitives'

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

type JitsiApiHandle = {
  dispose: () => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApiHandle
  }
}

let jitsiScriptLoad: Promise<void> | null = null

function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve()
  if (!jitsiScriptLoad) {
    jitsiScriptLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Jitsi SDK'))
      document.head.appendChild(script)
    })
  }
  return jitsiScriptLoad
}

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
  const [joinResponse, setJoinResponse] = useState<JoinResponse | null>(null)
  const roomRef = useRef<HTMLDivElement | null>(null)
  const jitsiApiRef = useRef<JitsiApiHandle | null>(null)

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

  async function joinSession(sessionId: number) {
    setJoiningId(sessionId)
    setJoinError(null)
    setError(null)
    try {
      const res = await api.post<JoinResponse>(`/telemedicine/sessions/${sessionId}/join`)
      setJoinResponse(res.data)
    } catch (err: any) {
      setJoinError(formatApiError(err, 'Failed to join consultation'))
    } finally {
      setJoiningId(null)
    }
  }

  function leaveRoom() {
    jitsiApiRef.current?.dispose()
    jitsiApiRef.current = null
    setJoinResponse(null)
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootRoom() {
      if (!joinResponse || !roomRef.current) return

      await loadJitsiScript()
      if (cancelled || !roomRef.current || !window.JitsiMeetExternalAPI) return

      jitsiApiRef.current?.dispose()
      const options: Record<string, unknown> = {
        roomName: joinResponse.roomId,
        parentNode: roomRef.current,
        userInfo: { displayName: joinResponse.displayName },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
      }
      if (joinResponse.joinToken && joinResponse.joinToken.trim()) {
        options.jwt = joinResponse.joinToken
      }

      const apiInstance = new window.JitsiMeetExternalAPI(joinResponse.jitsiDomain, options)

      jitsiApiRef.current = apiInstance
    }

    void bootRoom()

    return () => {
      cancelled = true
    }
  }, [joinResponse])

  useEffect(() => {
    return () => {
      jitsiApiRef.current?.dispose()
    }
  }, [])

  const activeSession = useMemo(() => joinResponse?.sessionId ?? null, [joinResponse])

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

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <div className="text-sm font-semibold text-slate-900">My sessions</div>
          <div className="mt-1 text-xs text-slate-500">Sessions open 10 minutes before and 60 minutes after the start time.</div>

          <div className="mt-4 space-y-3">
            {sessions.map((session) => {
              const selected = activeSession === session.sessionId
              return (
                <div key={session.sessionId} className={`rounded-xl border p-3 ${selected ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Consultation #{session.sessionId}</div>
                      <div className="text-xs text-slate-500">Appointment {session.appointmentId} • {session.participantRole}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{session.sessionStatus}</Badge>
                      {session.joinable ? <Badge>Joinable</Badge> : <Badge>Locked</Badge>}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-slate-600">
                    <div>Room: <span className="font-mono text-slate-900">{session.roomId}</span></div>
                    <div>Start: <span className="font-mono text-slate-900">{formatTime(session.scheduledStartTime)}</span></div>
                    <div>Window: <span className="font-mono text-slate-900">{formatTime(session.joinOpensAt)}</span> → <span className="font-mono text-slate-900">{formatTime(session.joinClosesAt)}</span></div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => joinSession(session.sessionId)} disabled={!session.joinable || joiningId === session.sessionId}>
                      {joiningId === session.sessionId ? 'Joining…' : selected ? 'Reconnect' : 'Join'}
                    </Button>
                  </div>
                </div>
              )
            })}

            {!loading && sessions.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No consultation sessions yet. Once an appointment is confirmed, a session will appear here.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Live room</div>
              <div className="text-xs text-slate-500">A Jitsi Meet room will mount here after you join.</div>
            </div>
            {joinResponse && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => openMeetingInNewTab(joinResponse.meetingUrl)}>
                  Open in new tab
                </Button>
                <Button variant="secondary" onClick={leaveRoom}>
                  Leave room
                </Button>
              </div>
            )}
          </div>

          {joinResponse ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div>Meeting URL: <span className="break-all font-mono text-slate-900">{joinResponse.meetingUrl}</span></div>
                {joinResponse.joinToken ? (
                  <div className="mt-1">Token expires at: <span className="font-mono text-slate-900">{formatTime(joinResponse.tokenExpiresAt)}</span></div>
                ) : (
                  <div className="mt-1">Public room mode (no JWT token attached).</div>
                )}
              </div>
              <div ref={roomRef} className="min-h-[680px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950" />
            </div>
          ) : (
            <div className="mt-4 flex min-h-[680px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Join a joinable session to open the secure video room.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}