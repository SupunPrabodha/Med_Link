import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label, Select, PageHeader } from '../ui/primitives'

type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

type PaymentRow = {
  id: number
  orderId: string
  appointmentId: number
  patientId: number
  amount: number
  currency: string
  status: PaymentStatus
  providerRef: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  failedAt: string | null
  reviewedAt?: string | null
  reviewedByAdminUserId?: number | null
  reviewNote?: string | null
  disputedAt?: string | null
  disputedByAdminUserId?: number | null
  disputeNote?: string | null
  refundedAt?: string | null
  refundedByAdminUserId?: number | null
  refundNote?: string | null
}

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const [patientId, setPatientId] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [status, setStatus] = useState<PaymentStatus | ''>('')

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const params: any = {}
      if (patientId.trim()) params.patientId = Number.parseInt(patientId.trim(), 10)
      if (appointmentId.trim()) params.appointmentId = Number.parseInt(appointmentId.trim(), 10)
      if (status) params.status = status

      const res = await api.get<PaymentRow[]>('/admin/payments', { params })
      setRows(res.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load payments'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markReviewed(id: number) {
    setError(null)
    setActionId(id)
    try {
      const res = await api.post<PaymentRow>(`/admin/payments/${id}/review`, { note: '' })
      setRows((prev) => prev.map((r) => (r.id === id ? res.data : r)))
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to mark reviewed'))
    } finally {
      setActionId(null)
    }
  }

  async function markDispute(id: number) {
    setError(null)
    setActionId(id)
    try {
      const res = await api.post<PaymentRow>(`/admin/payments/${id}/dispute`, { note: '' })
      setRows((prev) => prev.map((r) => (r.id === id ? res.data : r)))
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to flag dispute'))
    } finally {
      setActionId(null)
    }
  }

  async function markRefunded(id: number) {
    setError(null)
    setActionId(id)
    try {
      const res = await api.post<PaymentRow>(`/admin/payments/${id}/refund`, { note: '' })
      setRows((prev) => prev.map((r) => (r.id === id ? res.data : r)))
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to mark refunded'))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CreditCard className="h-6 w-6 text-white" />}
        title="Payments Administration"
        description="Admin view: all patient payments and resolutions"
        actions={
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Filter: Patient ID</Label>
            <div className="mt-1">
              <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. 12" />
            </div>
          </div>
          <div>
            <Label>Filter: Appointment ID</Label>
            <div className="mt-1">
              <Input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} placeholder="e.g. 45" />
            </div>
          </div>
          <div>
            <Label>Filter: Status</Label>
            <div className="mt-1">
              <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="">All</option>
                <option value="PENDING">PENDING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={refresh} disabled={loading}>
            Apply filters
          </Button>
        </div>

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
                <th className="px-3 py-2 font-semibold">Patient ID</th>
                <th className="px-3 py-2 font-semibold">Appointment ID</th>
                <th className="px-3 py-2 font-semibold">Order</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Audit</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.id}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.patientId}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.appointmentId}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.orderId}</td>
                  <td className="px-3 py-3">
                    <Badge>
                      {p.amount} {p.currency}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-700">
                    <div>Updated {new Date(p.updatedAt).toLocaleString()}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {p.reviewedAt && <Badge>REVIEWED</Badge>}
                      {p.disputedAt && <Badge>DISPUTED</Badge>}
                      {p.refundedAt && <Badge>REFUNDED</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {!p.reviewedAt && (
                        <Button variant="secondary" onClick={() => markReviewed(p.id)} disabled={loading || actionId === p.id}>
                          {actionId === p.id ? 'Working…' : 'Mark reviewed'}
                        </Button>
                      )}
                      {!p.disputedAt && (
                        <Button variant="secondary" onClick={() => markDispute(p.id)} disabled={loading || actionId === p.id}>
                          {actionId === p.id ? 'Working…' : 'Flag dispute'}
                        </Button>
                      )}
                      {!p.refundedAt && (
                        <Button variant="secondary" onClick={() => markRefunded(p.id)} disabled={loading || actionId === p.id}>
                          {actionId === p.id ? 'Working…' : 'Mark refunded'}
                        </Button>
                      )}
                      {p.reviewedAt && p.disputedAt && p.refundedAt && <span className="text-xs text-slate-500">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                    No payments found.
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
