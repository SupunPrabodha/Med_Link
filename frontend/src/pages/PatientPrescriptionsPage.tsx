import { useEffect, useState } from 'react'
import { Pill } from 'lucide-react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, PageHeader } from '../ui/primitives'

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

export function PatientPrescriptionsPage() {
  const [rows, setRows] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Prescription[]>('/prescriptions/patient/me')
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Pill className="h-6 w-6 text-white" />}
        title="Prescriptions"
        description="Your past digital prescriptions issued by doctors."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />
      {error && (
        <Alert tone="error">{error}</Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Issued</th>
                <th className="px-3 py-2 font-semibold">Doctor</th>
                <th className="px-3 py-2 font-semibold">Appointment</th>
                <th className="px-3 py-2 font-semibold">Diagnosis</th>
                <th className="px-3 py-2 font-semibold">Medications</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.id}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(p.issuedAt).toLocaleString()}</td>
                  <td className="px-3 py-3"><Badge>#{p.doctorUserId}</Badge></td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.appointmentId ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-700">{p.diagnosis?.trim() || '—'}</td>
                  <td className="px-3 py-3 text-slate-700">
                    <pre className="whitespace-pre-wrap text-xs leading-5">{p.medications}</pre>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{p.notes?.trim() || '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No prescriptions yet.
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
