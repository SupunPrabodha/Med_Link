import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { connectSse } from '../lib/sse'
import { Alert, Badge, Button, Card, Label, Select, PageHeader, cn } from '../ui/primitives'

type DoctorOption = {
  id: number
  fullName: string
  specialization: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  profilePhotoUrl?: string | null
  fee?: number | null
}

type Appointment = {
  id: number
  patientId: number
  doctorId: number
  slotTime: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
  appoinmentApproval?: 'APPROVED' | 'DECLINED' | null
}

function DoctorSelectbox({
  options,
  value,
  onChange,
  disabled
}: {
  options: DoctorOption[];
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedItem = options.find((o) => String(o.id) === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50"
        )}
      >
        {selectedItem ? (
          <div className="flex items-center gap-3 truncate pr-4">
            {selectedItem.profilePhotoUrl ? (
              <img src={selectedItem.profilePhotoUrl} alt={selectedItem.fullName} className="h-6 w-6 rounded-full object-cover shrink-0 ring-1 ring-slate-100" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-[10px] font-bold text-white shrink-0">
                 {selectedItem.fullName.substring(0,2).toUpperCase()}
              </div>
            )}
            <div className="truncate">
              <span className="font-semibold text-slate-800">{selectedItem.fullName}</span>
              <span className="text-slate-500 text-xs ml-1 hidden sm:inline">— {selectedItem.specialization}</span>
            </div>
          </div>
        ) : (
          <span className="text-slate-500">Select a verified doctor...</span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 py-2 origin-top animate-fade-in">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No verified doctors available</div>
          ) : (
            options.map((doc) => {
              const isSelected = String(doc.id) === value;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    onChange(String(doc.id));
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-50",
                    isSelected ? "bg-sky-50/50" : ""
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {doc.profilePhotoUrl ? (
                      <img src={doc.profilePhotoUrl} alt={doc.fullName} className="h-10 w-10 rounded-full object-cover border border-slate-100 shrink-0 shadow-sm" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-xs font-bold text-white shrink-0 shadow-inner">
                        {doc.fullName.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col truncate pr-2">
                      <span className={cn("text-sm font-bold truncate", isSelected ? "text-sky-700" : "text-slate-800")}>
                        {doc.fullName}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-slate-500 truncate">{doc.specialization}</span>
                        {doc.fee != null && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-[11px] font-semibold text-emerald-600">LKR {doc.fee.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-sky-600 shrink-0 ml-2" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export function AppointmentsPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isAdmin = hasRole(user, 'ADMIN')

  const doctorIdFromUrl = (searchParams.get('doctorId') ?? '').trim()
  const parsedDoctorIdFromUrl = (() => {
    if (!doctorIdFromUrl) return null
    const n = Number.parseInt(doctorIdFromUrl, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  })()

  const sseRef = useRef<{ close: () => void } | null>(null)

  const [rows, setRows] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refreshSlots(nextDoctorId?: string) {
    const idStr = (nextDoctorId ?? doctorId).trim()
    if (!idStr) {
      setAvailableSlots([])
      setSlotTime('')
      return
    }

    const parsedDoctorId = Number.parseInt(idStr, 10)
    if (!Number.isFinite(parsedDoctorId) || parsedDoctorId <= 0) {
      setAvailableSlots([])
      setSlotTime('')
      return
    }

    setSlotsLoading(true)
    setError(null)
    try {
      const res = await api.get<string[]>('/appointments/available-slots', {
        params: { doctorId: parsedDoctorId, days: 14 },
      })
      setAvailableSlots(res.data)
      setSlotTime(res.data[0] ?? '')
    } catch (err: any) {
      setAvailableSlots([])
      setSlotTime('')
      setError(formatApiError(err, 'Failed to load available slots'))
    } finally {
      setSlotsLoading(false)
    }
  }

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const apptsReq = isAdmin ? api.get<Appointment[]>('/admin/appointments') : api.get<Appointment[]>('/appointments')
      const [appts, docs] = await Promise.all([apptsReq, api.get<DoctorOption[]>('/doctors')])
      setRows(appts.data)
      setDoctors(docs.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to refresh'))
    } finally {
      setLoading(false)
    }
  }

  async function create() {
    setError(null)
    setLoading(true)
    try {
      const parsedDoctorId = Number.parseInt(doctorId, 10)
      if (!Number.isFinite(parsedDoctorId) || parsedDoctorId <= 0) {
        setError('Please select a doctor')
        return
      }

      const parsedSlotMs = new Date(slotTime).getTime()
      if (!Number.isFinite(parsedSlotMs)) {
        setError('Please select an available slot')
        return
      }
      if (parsedSlotMs <= Date.now() + 60_000) {
        setError('Slot time must be at least 1 minute in the future')
        return
      }

      const payload = {
        doctorId: parsedDoctorId,
        slotTime,
      }
      await api.post('/appointments', payload)
      await refresh()
      await refreshSlots()
    } catch (err: any) {
      setError(formatApiError(err, 'Create failed'))
    } finally {
      setLoading(false)
    }
  }

  async function joinVideo(appointmentId: number) {
    setError(null)
    setJoiningId(appointmentId)
    try {
      // Verify the session exists before navigating
      await api.get<{ joinUrl: string }>(`/telemedicine/sessions/appointment/${appointmentId}`)
      nav(`/app/telemedicine/${appointmentId}`)
    } catch (err: any) {
      setError(formatApiError(err, 'Telemedicine session is not ready yet. Please try again in a moment.'))
    } finally {
      setJoiningId(null)
    }
  }

  async function cancel(id: number) {
    setError(null)
    try {
      await api.delete(isAdmin ? `/admin/appointments/${id}` : `/appointments/${id}`)
      await refresh()
      if (!isAdmin) await refreshSlots()
    } catch (err: any) {
      setError(formatApiError(err, 'Cancel failed'))
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    if (isAdmin) return
    if (!parsedDoctorIdFromUrl) return
    setDoctorId(String(parsedDoctorIdFromUrl))
  }, [isAdmin, parsedDoctorIdFromUrl])

  useEffect(() => {
    // Real-time updates via SSE (no polling)
    const token = localStorage.getItem('medilink.token')
    if (!token) return

    sseRef.current?.close()
    sseRef.current = connectSse(isAdmin ? '/appointments/admin/stream' : '/appointments/stream', token, {
      onEvent: (evt) => {
        if (evt.event !== 'appointment') return
        try {
          const appt = JSON.parse(evt.data) as Appointment
          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === appt.id)
            const next = idx === -1 ? [...prev, appt] : prev.map((r) => (r.id === appt.id ? appt : r))
            next.sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime())
            return next
          })
        } catch {
          // ignore parse errors
        }
      },
      onError: () => {
        // keep UI quiet; user can hit Refresh if needed
      },
      reconnectMs: 1500,
    })

    return () => {
      sseRef.current?.close()
      sseRef.current = null
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) void refreshSlots()
  }, [doctorId, isAdmin])

  const adminDoctorFilterId = isAdmin ? parsedDoctorIdFromUrl : null
  const adminDoctorFilter = adminDoctorFilterId ? doctors.find((d) => d.id === adminDoctorFilterId) ?? null : null
  const filteredAdminRows = adminDoctorFilterId ? rows.filter((r) => r.doctorId === adminDoctorFilterId) : []

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Calendar className="h-6 w-6 text-white" />}
        title="Appointments"
        description={isAdmin ? 'Admin view: manage platform appointments' : 'Create and manage patient appointments'}
        actions={
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <Card className="relative z-10">
        {!isAdmin && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="z-20">
              <Label>Select Doctor</Label>
              <div className="mt-1">
                <DoctorSelectbox
                  options={doctors.filter((d) => d.status === 'VERIFIED')}
                  value={doctorId}
                  onChange={setDoctorId}
                  disabled={loading}
                />
              </div>
              {doctors.length === 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  No verified doctors available yet. Ask an admin to approve a doctor profile.
                </div>
              )}
            </div>
            
            <div className="relative z-10">
              <Label>Available Slot</Label>
              <div className="mt-1">
                <Select value={slotTime} onChange={(e) => setSlotTime(e.target.value)} disabled={loading || slotsLoading || !doctorId.trim()} className="py-2.5">
                  <option value="">
                    {!doctorId.trim()
                      ? 'Select a doctor first…'
                      : slotsLoading
                        ? 'Loading slots…'
                        : availableSlots.length === 0
                          ? 'No available slots'
                          : 'Select a slot…'}
                  </option>
                  {availableSlots.map((iso) => (
                    <option key={iso} value={iso}>
                      {new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </option>
                  ))}
                </Select>
              </div>
              {doctorId.trim() && !slotsLoading && availableSlots.length === 0 && (
                <div className="mt-2 text-[11px] text-slate-500 leading-tight">This doctor has no availability set (or all slots are booked).</div>
              )}
            </div>
            
            <div className="flex items-end z-10">
              <Button className="w-full py-2.5 shadow-sm" onClick={create} disabled={loading || slotsLoading || !doctorId.trim() || !slotTime.trim()}>
                Book Appointment
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </Card>

      {isAdmin && adminDoctorFilterId && (
        <Card className="relative z-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Appointments for selected doctor</div>
              <div className="text-xs text-slate-500">
                {adminDoctorFilter ? `${adminDoctorFilter.fullName} • D-${adminDoctorFilterId}` : `Doctor D-${adminDoctorFilterId}`}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.delete('doctorId')
                setSearchParams(next)
              }}
              disabled={loading}
            >
              Clear doctor filter
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-y border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Patient Code</th>
                  <th className="px-4 py-3">Doctor Code</th>
                  <th className="px-4 py-3">Slot Time</th>
                  <th className="px-4 py-3">Doctor Review</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdminRows.map((a) => (
                  <tr key={`doc-${adminDoctorFilterId}-${a.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">#{a.id}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">P-{a.patientId}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">D-{a.doctorId}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{new Date(a.slotTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3.5">
                      {a.appoinmentApproval ? <Badge>{a.appoinmentApproval}</Badge> : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Pending</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={() => cancel(a.id)}
                          disabled={a.status === 'CANCELLED' || joiningId === a.id}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAdminRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500 bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center">
                        <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                        <span className="font-medium text-slate-600">No appointments for this doctor</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="relative z-0">
        <div className="text-sm font-semibold text-slate-900">{isAdmin ? 'All appointments (system-wide)' : 'My appointments'}</div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-y border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">ID</th>
                {isAdmin && <th className="px-4 py-3">Patient Code</th>}
                <th className="px-4 py-3">Doctor Code</th>
                <th className="px-4 py-3">Slot Time</th>
                <th className="px-4 py-3">Doctor Review</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">#{a.id}</td>
                  {isAdmin && <td className="px-4 py-3.5 font-mono text-xs text-slate-600">P-{a.patientId}</td>}
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600">D-{a.doctorId}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{new Date(a.slotTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-3.5">
                    {a.appoinmentApproval ? <Badge>{a.appoinmentApproval}</Badge> : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Pending</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {!isAdmin && a.status === 'CONFIRMED' && (
                        <button
                          onClick={() => joinVideo(a.id)}
                          disabled={joiningId === a.id}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {joiningId === a.id ? 'Connecting…' : 'Join Video'}
                        </button>
                      )}
                      <button
                        onClick={() => cancel(a.id)}
                        disabled={a.status === 'CANCELLED' || joiningId === a.id}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-slate-500 bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                      <span className="font-medium text-slate-600">No appointments scheduled</span>
                      <span className="text-xs mt-1">When you book an appointment, it will appear here.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-slate-500 flex items-start gap-2">
          <span className="text-sky-500 font-bold">ℹ️</span>
          {isAdmin ? (
            <span>
              Note: Canceling appointments updates status automatically and triggers event notification dispatches via Kafka streams.
            </span>
          ) : (
            <span>
              Quick Tip: Wait for the doctor to explicitly <strong>Approve</strong> your appointment request before making any payments.<br/>
              Payments are resolved using your unique <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">appointmentId</span>.
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
