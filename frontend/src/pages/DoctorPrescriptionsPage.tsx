import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label, Textarea } from '../ui/primitives'

type Prescription = {
  id: number
  doctorUserId: number
  patientUserId: number
  appointmentId?: number | null
  diagnosis?: string | null
  medications: string
  notes?: string | null
  issuedAt: string
}

export function DoctorPrescriptionsPage() {
  const loc = useLocation()
  const queryPatientId = useMemo(() => {
    const v = new URLSearchParams(loc.search).get('patientId')
    const n = v ? Number(v) : NaN
    return Number.isFinite(n) && n > 0 ? String(n) : ''
  }, [loc.search])

  const [patientUserId, setPatientUserId] = useState(queryPatientId)
  const [appointmentId, setAppointmentId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medications, setMedications] = useState('')
  const [notes, setNotes] = useState('')

  const [rows, setRows] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!patientUserId && queryPatientId) setPatientUserId(queryPatientId)
  }, [queryPatientId, patientUserId])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Prescription[]>('/prescriptions/doctor/me')
      setRows(res.data ?? [])
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load prescriptions'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function issue() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const pid = Number(patientUserId)
      const aid = appointmentId.trim() ? Number(appointmentId) : null
      const payload = {
        patientUserId: Number.isFinite(pid) ? pid : null,
        appointmentId: aid && Number.isFinite(aid) ? aid : null,
        diagnosis: diagnosis.trim() || null,
        medications: medications,
        notes: notes.trim() || null,
      }
      await api.post('/prescriptions/doctor/me', payload)
      setSuccess('Prescription issued.')
      setDiagnosis('')
      setMedications('')
      setNotes('')
      await load()
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to issue prescription'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-sm font-semibold text-slate-900">Issue Digital Prescription</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Patient User ID</Label>
            <div className="mt-1">
              <Input value={patientUserId} onChange={(e) => setPatientUserId(e.target.value)} placeholder="e.g., 12" />
            </div>
          </div>
          <div>
            <Label>Appointment ID (optional)</Label>
            <div className="mt-1">
              <Input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} placeholder="e.g., 55" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Diagnosis (optional)</Label>
            <div className="mt-1">
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Short diagnosis" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Medications</Label>
            <div className="mt-1">
              <Textarea value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="e.g., Paracetamol 500mg - 1 tab after meals, 3 times a day" rows={5} />
            </div>
            <div className="mt-1 text-xs text-slate-500">Use multiple lines for multiple medicines.</div>
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (optional)</Label>
            <div className="mt-1">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={issue} disabled={saving || !patientUserId.trim() || !medications.trim()}>
            {saving ? 'Issuing…' : 'Issue'}
          </Button>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh List'}
          </Button>
        </div>
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mt-4">
            <Alert tone="success">{success}</Alert>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">My Issued Prescriptions</div>
            <div className="text-xs text-slate-500">History of prescriptions you issued.</div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Issued</th>
                <th className="px-3 py-2 font-semibold">Patient</th>
                <th className="px-3 py-2 font-semibold">Appointment</th>
                <th className="px-3 py-2 font-semibold">Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.id}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(p.issuedAt).toLocaleString()}</td>
                  <td className="px-3 py-3"><Badge>#{p.patientUserId}</Badge></td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.appointmentId ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-700">{p.diagnosis?.trim() || '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No prescriptions issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
