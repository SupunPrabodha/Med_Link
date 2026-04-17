import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label, PageHeader } from '../ui/primitives'

type PatientProfile = {
  id: number
  userId: number
  fullName: string
  phone: string
  dateOfBirth: string | null
  address: string | null
  updatedAt: string
}

type MedicalReport = {
  id: number
  fileName: string
  contentType: string
  sizeBytes: number
  description: string | null
  uploadedAt: string
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, idx)
  const rounded = value >= 10 || idx === 0 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded} ${units[idx]}`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function AdminPatientsPage() {
  const [rows, setRows] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')

  const [selected, setSelected] = useState<PatientProfile | null>(null)
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<PatientProfile[]>('/admin/patients')
      setRows(res.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load patients'))
    } finally {
      setLoading(false)
    }
  }

  async function loadReports(userId: number) {
    setReportsLoading(true)
    setReportsError(null)
    try {
      const res = await api.get<MedicalReport[]>(`/admin/patients/${userId}/reports`)
      setReports(res.data)
    } catch (err: any) {
      setReports([])
      setReportsError(formatApiError(err, 'Failed to load reports'))
    } finally {
      setReportsLoading(false)
    }
  }

  async function downloadReport(userId: number, r: MedicalReport) {
    setReportsError(null)
    try {
      const res = await api.get(`/admin/patients/${userId}/reports/${r.id}/download`, { responseType: 'blob' })
      downloadBlob(res.data, r.fileName)
    } catch (err: any) {
      setReportsError(formatApiError(err, 'Failed to download report'))
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = rows.filter((p) => {
    const needle = q.trim().toLowerCase()
    if (!needle) return true
    return (
      String(p.userId).includes(needle) ||
      p.fullName.toLowerCase().includes(needle) ||
      p.phone.toLowerCase().includes(needle) ||
      (p.address ?? '').toLowerCase().includes(needle)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-6 w-6 text-white" />}
        title="Patient Profiles"
        description="Admin view: read-only access to patient profiles and reports"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <div>
              <div className="mt-1">
                <Input className="border-sky-200/50 bg-white/20 text-white placeholder-sky-200" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by userId, name, phone…" />
              </div>
            </div>
            <Button variant="secondary" onClick={refresh} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
        }
      />
      {error && (
        <Alert tone="error">{error}</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold text-slate-900">Patient profiles</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">User ID</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  <th className="px-3 py-2 font-semibold">Updated</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((p) => (
                  <tr key={p.userId} className={selected?.userId === p.userId ? 'bg-slate-50' : 'hover:bg-slate-50'}>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.userId}</td>
                    <td className="px-3 py-3 text-slate-700">{p.fullName}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{p.phone}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{new Date(p.updatedAt).toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <Button
                        variant={selected?.userId === p.userId ? 'primary' : 'secondary'}
                        onClick={() => {
                          setSelected(p)
                          void loadReports(p.userId)
                        }}
                      >
                        Reports
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      No patient profiles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Medical reports</div>
              <div className="text-xs text-slate-500">
                {selected ? (
                  <span>
                    For user <span className="font-mono">{selected.userId}</span>
                  </span>
                ) : (
                  'Select a patient'
                )}
              </div>
            </div>
            {selected && <Badge>{reports.length} reports</Badge>}
          </div>

          {reportsError && (
            <div className="mt-3">
              <Alert tone="error">{reportsError}</Alert>
            </div>
          )}

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">File</th>
                  <th className="px-3 py-2 font-semibold">Size</th>
                  <th className="px-3 py-2 font-semibold">Uploaded</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-700">
                      <div className="font-medium">{r.fileName}</div>
                      {r.description && <div className="text-xs text-slate-500">{r.description}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">{formatBytes(r.sizeBytes)}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{new Date(r.uploadedAt).toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <Button variant="secondary" onClick={() => selected && downloadReport(selected.userId, r)} disabled={!selected}>
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}

                {selected && !reportsLoading && reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      No reports.
                    </td>
                  </tr>
                )}
                {reportsLoading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      Loading reports…
                    </td>
                  </tr>
                )}
                {!selected && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      Select a patient to view reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-xs text-slate-500">
          Note: this list includes only users who have created a patient profile. Use <span className="font-mono">User Management</span> to see all accounts.
        </div>
      </Card>
    </div>
  )
}
