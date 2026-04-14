import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card } from '../ui/primitives'

type DoctorAppointmentRow = {
    id: number
    patientId: number
    doctorId: number
    slotTime: string
    status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
    appoinmentApproval?: 'APPROVED' | 'DECLINED' | null
}

export function DoctorBookedAppointmentsCard() {
    const [doctorAppointments, setDoctorAppointments] = useState<DoctorAppointmentRow[]>([])
    const [doctorAppointmentsLoading, setDoctorAppointmentsLoading] = useState(false)
    const [doctorAppointmentsError, setDoctorAppointmentsError] = useState<string | null>(null)
    const [updatingAppointmentId, setUpdatingAppointmentId] = useState<number | null>(null)

    async function loadDoctorAppointments() {
        setDoctorAppointmentsError(null)
        setDoctorAppointmentsLoading(true)
        try {
            const res = await api.get<DoctorAppointmentRow[]>('/appointments/doctor/me')
            setDoctorAppointments(res.data ?? [])
        } catch (err: any) {
            const status = err?.response?.status
            if (status === 404) {
                setDoctorAppointments([])
                setDoctorAppointmentsError('Create your doctor profile first to view your appointments.')
                return
            }
            setDoctorAppointmentsError(formatApiError(err, 'Failed to load appointments'))
        } finally {
            setDoctorAppointmentsLoading(false)
        }
    }

    useEffect(() => {
        void loadDoctorAppointments()
    }, [])

    const pendingAppointments = useMemo(
        () => doctorAppointments.filter((a) => a.appoinmentApproval == null),
        [doctorAppointments],
    )

    async function updateApproval(appointmentId: number, appoinmentApproval: 'APPROVED' | 'DECLINED') {
        setDoctorAppointmentsError(null)
        setUpdatingAppointmentId(appointmentId)
        try {
            await api.put<DoctorAppointmentRow>(`/appointments/doctor/me/${appointmentId}/approval`, {
                appoinmentApproval,
            })
            setDoctorAppointments((prev) => prev.filter((a) => a.id !== appointmentId))
        } catch (err: any) {
            setDoctorAppointmentsError(formatApiError(err, 'Failed to update appointment approval'))
        } finally {
            setUpdatingAppointmentId(null)
        }
    }

    return (
        <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-900">Booked patients</div>
                    <div className="text-xs text-slate-500">Pending approvals only. Approved/declined items are removed from this list.</div>
                </div>
                <Button variant="secondary" onClick={loadDoctorAppointments} disabled={doctorAppointmentsLoading}>
                    {doctorAppointmentsLoading ? 'Loading…' : 'Refresh'}
                </Button>
            </div>

            {doctorAppointmentsError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{doctorAppointmentsError}</div>
            )}

            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                            <th className="px-3 py-2 font-semibold">Appointment ID</th>
                            <th className="px-3 py-2 font-semibold">Patient ID</th>
                            <th className="px-3 py-2 font-semibold">Slot time</th>
                            <th className="px-3 py-2 font-semibold">Approval</th>
                            <th className="px-3 py-2 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pendingAppointments.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50">
                                <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.id}</td>
                                <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.patientId}</td>
                                <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
                                <td className="px-3 py-3">
                                    <span className="text-xs text-slate-500">Pending</span>
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => updateApproval(a.id, 'APPROVED')}
                                            disabled={doctorAppointmentsLoading || updatingAppointmentId === a.id}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => updateApproval(a.id, 'DECLINED')}
                                            disabled={doctorAppointmentsLoading || updatingAppointmentId === a.id}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!doctorAppointmentsLoading && pendingAppointments.length === 0 && !doctorAppointmentsError && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                                    No pending approvals.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
