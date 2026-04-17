import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card, PageHeader } from '../ui/primitives'

type MedicalReport = {
    id: number
    fileName: string
    contentType: string
    sizeBytes: number
    description?: string | null
    uploadedAt: string
}

type DoctorPatientRow = {
    patientId: number
    fullName?: string | null
    phone?: string | null
    confirmedAppointmentsCount: number
    reports: MedicalReport[]
}

function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
    const value = bytes / 1024 ** idx
    const rounded = value >= 10 || idx === 0 ? Math.round(value) : Math.round(value * 10) / 10
    return `${rounded} ${units[idx]}`
}

export function DoctorPatientsPage() {
    const [rows, setRows] = useState<DoctorPatientRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null)

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get<DoctorPatientRow[]>('/appointments/doctor/me/patients')
            setRows(res.data ?? [])
        } catch (err: any) {
            const status = err?.response?.status
            if (status === 404) {
                setRows([])
                setError('Create your doctor profile first to view your patients.')
            } else {
                setError(formatApiError(err, 'Failed to load patients'))
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    async function downloadReport(patientId: number, report: MedicalReport) {
        setError(null)
        setDownloadingReportId(report.id)
        try {
            const res = await api.get<Blob>(`/appointments/doctor/me/patients/${patientId}/reports/${report.id}/download`, {
                responseType: 'blob',
            })

            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = report.fileName || `report-${report.id}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (err: any) {
            setError(formatApiError(err, 'Failed to download report'))
        } finally {
            setDownloadingReportId(null)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                icon={<Users className="h-6 w-6 text-white" />}
                title="Patients"
                description="Patients with at least one CONFIRMED appointment for you."
                actions={
                    <Button variant="secondary" onClick={load} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </Button>
                }
            />

            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium shadow-sm">{error}</div>}

            <div className="space-y-3">
                {rows.map((p) => (
                    <Card key={p.patientId}>
                        <details>
                            <summary className="cursor-pointer list-none">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{p.fullName?.trim() || `Patient #${p.patientId}`}</div>
                                        <div className="text-xs text-slate-500">
                                            Patient ID {p.patientId}
                                            {p.phone ? ` • ${p.phone}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/app/doctor/prescriptions?patientId=${p.patientId}`}
                                            className="inline-flex h-10 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50 active:bg-white"
                                        >
                                            Issue prescription
                                        </Link>
                                        <Badge>{p.confirmedAppointmentsCount} confirmed</Badge>
                                        <Badge>{p.reports.length} reports</Badge>
                                        <span className="text-xs text-slate-500">▼</span>
                                    </div>
                                </div>
                            </summary>

                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2 font-semibold">Report ID</th>
                                            <th className="px-3 py-2 font-semibold">File</th>
                                            <th className="px-3 py-2 font-semibold">Type</th>
                                            <th className="px-3 py-2 font-semibold">Size</th>
                                            <th className="px-3 py-2 font-semibold">Description</th>
                                            <th className="px-3 py-2 font-semibold">Uploaded</th>
                                            <th className="px-3 py-2 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {p.reports.map((r) => (
                                            <tr key={r.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-3 font-mono text-xs text-slate-700">{r.id}</td>
                                                <td className="px-3 py-3 text-slate-700">{r.fileName}</td>
                                                <td className="px-3 py-3 text-xs text-slate-700">{r.contentType}</td>
                                                <td className="px-3 py-3 font-mono text-xs text-slate-700">{formatBytes(r.sizeBytes)}</td>
                                                <td className="px-3 py-3 text-slate-700">{r.description?.trim() || '—'}</td>
                                                <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(r.uploadedAt).toLocaleString()}</td>
                                                <td className="px-3 py-3">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => downloadReport(p.patientId, r)}
                                                        disabled={downloadingReportId === r.id}
                                                    >
                                                        {downloadingReportId === r.id ? 'Downloading…' : 'Download'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {p.reports.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                                                    No reports submitted by this patient.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    </Card>
                ))}

                {!loading && rows.length === 0 && !error && (
                    <Card>
                        <div className="text-sm text-slate-500">No patients with confirmed appointments yet.</div>
                    </Card>
                )}
            </div>
        </div>
    )
}
