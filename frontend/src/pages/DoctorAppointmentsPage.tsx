import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { connectSse } from '../lib/sse'
import { Badge, Button, Card, Label } from '../ui/primitives'

type DoctorAppointmentRow = {
    id: number
    patientId: number
    doctorId: number
    slotTime: string
    status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
    appoinmentApproval?: 'APPROVED' | 'DECLINED' | null
}

type FilterMode = 'PENDING_APPROVAL' | 'APPROVED' | 'CONFIRMED' | 'CANCELLED'

export function DoctorAppointmentsPage() {
    const [rows, setRows] = useState<DoctorAppointmentRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterMode>('PENDING_APPROVAL')
    const [updatingId, setUpdatingId] = useState<number | null>(null)
    const [joiningId, setJoiningId] = useState<number | null>(null)
    const [completingId, setCompletingId] = useState<number | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const sseRef = useRef<{ close: () => void } | null>(null)

    async function load() {
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const res = await api.get<DoctorAppointmentRow[]>('/appointments/doctor/me')
            setRows(res.data ?? [])
        } catch (err: any) {
            const status = err?.response?.status
            if (status === 404) {
                setRows([])
                setError('Create your doctor profile first to view your appointments.')
            } else {
                setError(formatApiError(err, 'Failed to load appointments'))
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    useEffect(() => {
        const token = localStorage.getItem('medilink.token')
        if (!token) return

        sseRef.current?.close()
        sseRef.current = connectSse('/appointments/doctor/me/stream', token, {
            onEvent: (evt) => {
                if (evt.event !== 'appointment') return
                try {
                    const appt = JSON.parse(evt.data) as DoctorAppointmentRow
                    setRows((prev) => {
                        const idx = prev.findIndex((r) => r.id === appt.id)
                        const next = idx === -1 ? [...prev, appt] : prev.map((r) => (r.id === appt.id ? appt : r))
                        next.sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime())
                        return next
                    })
                } catch {
                    // ignore
                }
            },
            reconnectMs: 1500,
        })

        return () => {
            sseRef.current?.close()
            sseRef.current = null
        }
    }, [])

    async function updateApproval(appointmentId: number, appoinmentApproval: 'APPROVED' | 'DECLINED') {
        setError(null)
        setSuccess(null)
        setUpdatingId(appointmentId)
        try {
            const res = await api.put<DoctorAppointmentRow>(`/appointments/doctor/me/${appointmentId}/approval`, { appoinmentApproval })
            const updated = res.data
            setRows((prev) => prev.map((r) => (r.id === appointmentId ? updated : r)))
        } catch (err: any) {
            setError(formatApiError(err, 'Failed to update approval'))
        } finally {
            setUpdatingId(null)
        }
    }

    async function cancelAppointment(appointmentId: number) {
        setError(null)
        setSuccess(null)
        setUpdatingId(appointmentId)
        try {
            const res = await api.delete<DoctorAppointmentRow>(`/appointments/doctor/me/${appointmentId}`)
            const updated = res.data
            setRows((prev) => prev.map((r) => (r.id === appointmentId ? updated : r)))
        } catch (err: any) {
            setError(formatApiError(err, 'Failed to cancel appointment'))
        } finally {
            setUpdatingId(null)
        }
    }

    async function joinVideo(appointmentId: number) {
        setError(null)
        setSuccess(null)
        setJoiningId(appointmentId)
        try {
            const res = await api.get<{ joinUrl: string }>(`/telemedicine/sessions/appointment/${appointmentId}`)
            const url = res.data?.joinUrl
            if (!url) {
                setError('Telemedicine session is not ready yet. Please try again in a moment.')
                return
            }

            const opened = window.open(url, '_blank', 'noopener,noreferrer')
            if (!opened) {
                window.location.href = url
            }
        } catch (err: any) {
            setError(formatApiError(err, 'Failed to open video session'))
        } finally {
            setJoiningId(null)
        }
    }

    async function completeConsultation(appointmentId: number) {
        setError(null)
        setSuccess(null)
        setCompletingId(appointmentId)
        try {
            await api.post(`/telemedicine/sessions/appointment/${appointmentId}/complete`)
            setSuccess(`Appointment #${appointmentId} marked as completed.`)
        } catch (err: any) {
            setError(formatApiError(err, 'Failed to mark consultation as completed'))
        } finally {
            setCompletingId(null)
        }
    }

    const filteredRows = useMemo(() => {
        if (filter === 'PENDING_APPROVAL') {
            return rows.filter((r) => r.appoinmentApproval == null && r.status !== 'CANCELLED')
        }
        if (filter === 'APPROVED') {
            return rows.filter((r) => r.appoinmentApproval === 'APPROVED' && r.status !== 'CONFIRMED' && r.status !== 'CANCELLED')
        }
        if (filter === 'CANCELLED') {
            return rows.filter((r) => r.status === 'CANCELLED')
        }
        return rows.filter((r) => r.status === 'CONFIRMED')
    }, [rows, filter])

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">Doctor appointments</div>
                        <div className="text-xs text-slate-500">Review booking requests, track approvals, and cancel appointments if needed.</div>
                    </div>
                    <Button variant="secondary" onClick={load} disabled={loading}>
                        {loading ? 'Loading…' : 'Refresh'}
                    </Button>
                </div>

                <div className="mt-4 w-full max-w-xs">
                    <Label>Filter</Label>
                    <div className="mt-1">
                        <select
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterMode)}
                            disabled={loading || updatingId != null}
                        >
                            <option value="PENDING_APPROVAL">Pending approval</option>
                            <option value="APPROVED">Approved (awaiting payment)</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
                {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{success}</div>}
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                                <th className="px-3 py-2 font-semibold">Appointment ID</th>
                                <th className="px-3 py-2 font-semibold">Patient ID</th>
                                <th className="px-3 py-2 font-semibold">Slot time</th>
                                <th className="px-3 py-2 font-semibold">Approval</th>
                                <th className="px-3 py-2 font-semibold">Status</th>
                                <th className="px-3 py-2 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredRows.map((a) => {
                                const busy = updatingId === a.id
                                const joining = joiningId === a.id
                                const completing = completingId === a.id
                                const canJoinVideo = a.status === 'CONFIRMED'
                                const canApprove = a.status !== 'CANCELLED' && (a.appoinmentApproval == null)
                                const canCancel = a.status !== 'CANCELLED' && a.appoinmentApproval === 'APPROVED'

                                return (
                                    <tr key={a.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.id}</td>
                                        <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.patientId}</td>
                                        <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
                                        <td className="px-3 py-3">
                                            {a.appoinmentApproval ? <Badge>{a.appoinmentApproval}</Badge> : <span className="text-xs text-slate-500">Pending</span>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge>{a.status}</Badge>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                {canJoinVideo && (
                                                    <>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => joinVideo(a.id)}
                                                            disabled={joining || completing || busy || loading || updatingId != null}
                                                        >
                                                            {joining ? 'Opening…' : 'Join video'}
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => completeConsultation(a.id)}
                                                            disabled={joining || completing || busy || loading || updatingId != null}
                                                        >
                                                            {completing ? 'Completing…' : 'Mark completed'}
                                                        </Button>
                                                    </>
                                                )}

                                                {canApprove && (
                                                    <>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => updateApproval(a.id, 'APPROVED')}
                                                            disabled={joining || completing || busy || loading || updatingId != null}
                                                        >
                                                            {busy ? 'Working…' : 'Accept'}
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => updateApproval(a.id, 'DECLINED')}
                                                            disabled={joining || completing || busy || loading || updatingId != null}
                                                        >
                                                            {busy ? 'Working…' : 'Reject'}
                                                        </Button>
                                                    </>
                                                )}

                                                {canCancel && (
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => cancelAppointment(a.id)}
                                                        disabled={joining || completing || busy || loading || updatingId != null}
                                                    >
                                                        {busy ? 'Cancelling…' : 'Cancel'}
                                                    </Button>
                                                )}

                                                {!canApprove && !canCancel && !canJoinVideo && <span className="text-xs text-slate-500">—</span>}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {!loading && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                                        {filter === 'PENDING_APPROVAL'
                                            ? 'No pending approvals.'
                                            : filter === 'APPROVED'
                                                ? 'No approved appointments awaiting payment.'
                                                : filter === 'CANCELLED'
                                                    ? 'No cancelled appointments.'
                                                    : 'No confirmed appointments.'}
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
