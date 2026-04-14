import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label } from '../ui/primitives'

type DoctorProfile = {
  id: number
  userId: number
  fullName: string
  registrationNo: string
  specialization: string
  documentsUrl?: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  updatedAt: string
  rejectionReason?: string | null
}

export function DoctorsPage() {
  const [specialization, setSpecialization] = useState('')
  const [rows, setRows] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<DoctorProfile[]>('/doctors', {
        params: specialization.trim() ? { specialization: specialization.trim() } : undefined,
      })
      setRows(res.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load doctors'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Doctors</div>
            <div className="text-xs text-slate-500">Search verified doctors (public workflow)</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <div>
              <Label>Specialization</Label>
              <div className="mt-1">
                <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g., Cardiologist" />
              </div>
            </div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </Button>
          </div>
        </div>
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </Card>

      <Card>
        <div className="text-xs text-slate-600">
          Note: only <span className="font-semibold">VERIFIED</span> doctors are listed here. New doctor accounts must submit a profile and be approved by an admin.
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Specialization</th>
                <th className="px-3 py-2 font-semibold">Reg No</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-medium text-slate-900">{d.fullName}</td>
                  <td className="px-3 py-3 text-slate-700">{d.specialization}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{d.registrationNo}</td>
                  <td className="px-3 py-3">
                    <Badge>{d.status}</Badge>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    No doctors found.
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
