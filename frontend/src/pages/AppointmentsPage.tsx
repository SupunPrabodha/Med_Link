import { useEffect, useState } from 'react'
import { hasRole, useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Label, Select } from '../ui/primitives'

type DoctorOption = {
  id: number
  fullName: string
  specialization: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

type Appointment = {
  id: number
  patientId: number
  doctorId: number
  slotTime: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
}

export function AppointmentsPage() {
  const { user } = useAuth()
  const isAdmin = hasRole(user, 'ADMIN')

  const [rows, setRows] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
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
    if (!isAdmin) void refreshSlots()
  }, [doctorId, isAdmin])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Appointments</div>
            <div className="text-xs text-slate-500">
              {isAdmin ? 'Admin view: manage platform appointments' : 'Create and manage patient appointments'}
            </div>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>

        {!isAdmin && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <Label>Doctor</Label>
              <div className="mt-1">
                <Select
                  value={doctorId}
                  onChange={(e) => {
                    setDoctorId(e.target.value)
                  }}
                  disabled={loading}
                >
                  <option value="">Select a verified doctor…</option>
                  {doctors
                    .filter((d) => d.status === 'VERIFIED')
                    .map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.fullName} — {d.specialization} (ID {d.id})
                      </option>
                    ))}
                </Select>
              </div>
              {doctors.length === 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  No verified doctors available yet. Ask an admin to approve a doctor profile.
                </div>
              )}
            </div>
            <div>
              <Label>Available slots</Label>
              <div className="mt-1">
                <Select value={slotTime} onChange={(e) => setSlotTime(e.target.value)} disabled={loading || slotsLoading || !doctorId.trim()}>
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
                      {new Date(iso).toLocaleString()}
                    </option>
                  ))}
                </Select>
              </div>
              {doctorId.trim() && !slotsLoading && availableSlots.length === 0 && (
                <div className="mt-2 text-xs text-slate-500">This doctor has no availability set (or all slots are booked).</div>
              )}
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={create} disabled={loading || slotsLoading || !doctorId.trim() || !slotTime.trim()}>
                Create
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                {isAdmin && <th className="px-3 py-2 font-semibold">Patient ID</th>}
                <th className="px-3 py-2 font-semibold">Doctor ID</th>
                <th className="px-3 py-2 font-semibold">Slot</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.id}</td>
                  {isAdmin && <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.patientId}</td>}
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.doctorId}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <Badge>{a.status}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Button variant="danger" onClick={() => cancel(a.id)}>
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-3 py-8 text-center text-slate-500">
                    No appointments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-slate-500">
          {isAdmin ? (
            <span>
              Note: canceling appointments updates status and publishes events for notifications.
            </span>
          ) : (
            <span>
              Note: payments are based on <span className="font-mono">appointmentId</span>. Create an appointment first.
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
