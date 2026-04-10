import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Button, Card, Input, Label } from '../ui/primitives'

type Appointment = {
  id: number
  patientId: number
  doctorId: number
  slotTime: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
}

export function AppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Appointment[]>('/api/appointments')
      setRows(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  async function create() {
    setError(null)
    setLoading(true)
    try {
      const payload = {
        doctorId: Number(doctorId),
        slotTime: new Date(slotTime).toISOString(),
      }
      await api.post('/api/appointments', payload)
      setDoctorId('')
      setSlotTime('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  async function cancel(id: number) {
    setError(null)
    try {
      await api.delete(`/api/appointments/${id}`)
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Cancel failed')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Appointments</div>
            <div className="text-xs text-slate-500">Create and manage patient appointments</div>
          </div>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <Label>Doctor ID</Label>
            <div className="mt-1">
              <Input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} placeholder="e.g., 1" />
            </div>
          </div>
          <div>
            <Label>Slot time</Label>
            <div className="mt-1">
              <Input type="datetime-local" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} />
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
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2">ID</th>
                <th className="py-2">Doctor ID</th>
                <th className="py-2">Slot</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 font-mono text-xs text-slate-700">{a.id}</td>
                  <td className="py-3 font-mono text-xs text-slate-700">{a.doctorId}</td>
                  <td className="py-3 font-mono text-xs text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
                  <td className="py-3">
                    <Badge>{a.status}</Badge>
                  </td>
                  <td className="py-3">
                    <Button variant="secondary" onClick={() => cancel(a.id)}>
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
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
