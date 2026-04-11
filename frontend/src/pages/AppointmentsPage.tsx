import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card, Input, Label } from '../ui/primitives'

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
  const [rows, setRows] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function getMinDateTimeLocal(minutesAhead: number) {
    const d = new Date(Date.now() + minutesAhead * 60_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [appts, docs] = await Promise.all([
        api.get<Appointment[]>('/appointments'),
        api.get<DoctorOption[]>('/doctors'),
      ])
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
        setError('Slot time is invalid')
        return
      }
      if (parsedSlotMs <= Date.now() + 60_000) {
        setError('Slot time must be at least 1 minute in the future')
        return
      }

      const payload = {
        doctorId: parsedDoctorId,
        slotTime: new Date(parsedSlotMs).toISOString(),
      }
      await api.post('/appointments', payload)
      // Keep doctor selection for faster repeated booking.
      setSlotTime('')
      await refresh()
    } catch (err: any) {
      setError(formatApiError(err, 'Create failed'))
    } finally {
      setLoading(false)
    }
  }

  async function cancel(id: number) {
    setError(null)
    try {
      await api.delete(`/appointments/${id}`)
      await refresh()
    } catch (err: any) {
      setError(formatApiError(err, 'Cancel failed'))
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Appointments</div>
            <div className="text-xs text-slate-500">Create and manage patient appointments</div>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <Label>Doctor</Label>
            <div className="mt-1">
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
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
              </select>
            </div>
            {doctors.length === 0 && (
              <div className="mt-2 text-xs text-slate-500">
                No verified doctors available yet. Ask an admin to approve a doctor profile.
              </div>
            )}
          </div>
          <div>
            <Label>Slot time</Label>
            <div className="mt-1">
              <Input
                type="datetime-local"
                min={getMinDateTimeLocal(1)}
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={create} disabled={loading || !doctorId.trim() || !slotTime.trim()}>
              Create
            </Button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
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
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.doctorId}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <Badge>{a.status}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Button variant="secondary" onClick={() => cancel(a.id)}>
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
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
          Note: payments are based on <span className="font-mono">appointmentId</span>. Create an appointment first.
        </div>
      </Card>
    </div>
  )
}
