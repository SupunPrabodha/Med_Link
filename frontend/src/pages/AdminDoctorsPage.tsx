import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card, Input, Label } from '../ui/primitives'

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

export function AdminDoctorsPage() {
  const [rows, setRows] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<DoctorProfile[]>('/admin/doctors/pending')
      setRows(res.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load pending doctors'))
    } finally {
      setLoading(false)
    }
  }

  async function approve(id: number) {
    setError(null)
    try {
      await api.post(`/admin/doctors/${id}/approve`)
      await load()
    } catch (err: any) {
      setError(formatApiError(err, 'Approve failed'))
    }
  }

  async function reject(id: number) {
    setError(null)
    try {
      await api.post(`/admin/doctors/${id}/reject`, { reason: (rejectReason[id] ?? '').trim() || 'Not specified' })
      await load()
    } catch (err: any) {
      setError(formatApiError(err, 'Reject failed'))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Doctor verification</div>
            <div className="text-xs text-slate-500">Admin-only workflow</div>
          </div>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Doctor</th>
                <th className="px-3 py-2 font-semibold">Specialization</th>
                <th className="px-3 py-2 font-semibold">Docs</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{d.fullName}</div>
                    <div className="font-mono text-xs text-slate-600">UID {d.userId}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{d.specialization}</td>
                  <td className="px-3 py-3">
                    {d.documentsUrl ? (
                      <a className="text-xs font-medium text-slate-900 underline underline-offset-4" href={d.documentsUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge>{d.status}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button onClick={() => approve(d.id)}>Approve</Button>
                        <Button variant="secondary" onClick={() => reject(d.id)}>
                          Reject
                        </Button>
                      </div>
                      <div>
                        <Label>Reject reason</Label>
                        <div className="mt-1">
                          <Input
                            value={rejectReason[d.id] ?? ''}
                            onChange={(e) => setRejectReason((prev) => ({ ...prev, [d.id]: e.target.value }))}
                            placeholder="Reason"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No pending doctors.
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
