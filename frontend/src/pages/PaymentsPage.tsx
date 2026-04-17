import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label, PageHeader } from '../ui/primitives'

type Appointment = {
  id: number
  doctorId: number
  slotTime: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
  appoinmentApproval?: 'APPROVED' | 'DECLINED' | null
}

type PaymentIntentResponse = {
  checkoutUrl: string
  formFields: Record<string, string>
}

export function PaymentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState('')
  const [amount, setAmount] = useState('1000')
  const [currency, setCurrency] = useState('LKR')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadAppointments() {
    setLoadingAppointments(true)
    setAppointmentsError(null)
    try {
      const res = await api.get<Appointment[]>('/appointments')
      setAppointments(res.data)
    } catch (err: any) {
      setAppointmentsError(formatApiError(err, 'Failed to load appointments'))
    } finally {
      setLoadingAppointments(false)
    }
  }

  function selectAppointment(id: number) {
    setAppointmentId(String(id))
    setError(null)
  }

  async function createIntent() {
    setLoading(true)
    setError(null)
    try {
      const parsedAppointmentId = Number.parseInt(appointmentId, 10)
      if (!Number.isFinite(parsedAppointmentId) || parsedAppointmentId <= 0) {
        setError('Please select an appointment')
        return
      }

      const cleanedAmount = amount.trim()
      const parsedAmount = Number.parseFloat(cleanedAmount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setError('Amount must be a positive number')
        return
      }

      const cleanedCurrency = currency.trim().toUpperCase()
      if (!cleanedCurrency) {
        setError('Currency is required')
        return
      }

      const res = await api.post<PaymentIntentResponse>('/payments/intents/stripe', {
        appointmentId: parsedAppointmentId,
        amount: cleanedAmount,
        currency: cleanedCurrency,
      })

      window.location.assign(res.data.checkoutUrl)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to start Stripe checkout'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAppointments()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const provider = (params.get('provider') || '').toLowerCase()
    const result = (params.get('result') || '').toLowerCase()

    if (provider !== 'stripe') return

    if (result === 'cancel') {
      setError('Payment was cancelled')
      navigate('/app/payments', { replace: true })
      return
    }

    const sessionId = params.get('session_id')
    if (result !== 'success' || !sessionId) return

    void (async () => {
      setLoading(true)
      setError(null)
      try {
        await api.post(`/payments/stripe/confirm?sessionId=${encodeURIComponent(sessionId)}`)
        navigate('/app/appointments', { replace: true })
      } catch (err: any) {
        setError(formatApiError(err, 'Payment succeeded, but confirmation failed'))
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CreditCard className="h-6 w-6 text-white" />}
        title="Payments"
        description="Pay securely for your consultation"
        actions={<Badge className="border-emerald-300 bg-emerald-50 text-emerald-700">Patient/Admin role</Badge>}
      />

      <Card>
        <div className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-700">Select an appointment</div>
              <div className="text-xs text-slate-500">Only doctor-approved PENDING_PAYMENT appointments can be paid</div>
            </div>
            <Button variant="secondary" onClick={loadAppointments} disabled={loadingAppointments}>
              {loadingAppointments ? 'Loading…' : 'Refresh'}
            </Button>
          </div>

          {appointmentsError && (
            <div className="mt-3">
              <Alert tone="error">{appointmentsError}</Alert>
            </div>
          )}

          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">ID</th>
                  <th className="px-3 py-2 font-semibold">Doctor ID</th>
                  <th className="px-3 py-2 font-semibold">Slot</th>
                  <th className="px-3 py-2 font-semibold">Doctor approval</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((a) => {
                  const isSelected = appointmentId === String(a.id)
                  const approved = a.appoinmentApproval === 'APPROVED'
                  const payable = a.status === 'PENDING_PAYMENT' && approved
                  return (
                    <tr key={a.id} className={isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.id}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.doctorId}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
                      <td className="px-3 py-3">
                        {a.appoinmentApproval ? <Badge>{a.appoinmentApproval}</Badge> : <span className="text-xs text-slate-500">Awaiting approval</span>}
                      </td>
                      <td className="px-3 py-3">
                        <Badge>{a.status}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Button variant={isSelected ? 'primary' : 'secondary'} onClick={() => selectAppointment(a.id)} disabled={!payable}>
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}

                {!loadingAppointments && appointments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      No appointments found. Create an appointment first.
                    </td>
                  </tr>
                )}
                {loadingAppointments && appointments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      Loading appointments…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <Label>Amount</Label>
            <div className="mt-1">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
            </div>
          </div>
          <div>
            <Label>Currency</Label>
            <div className="mt-1">
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="LKR" />
            </div>
          </div>
          <div>
            <Label>Selected appointment</Label>
            <div className="mt-1">
              <Input value={appointmentId} placeholder="Select from the list above" readOnly />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={createIntent} disabled={loading || !appointmentId.trim()}>
            {loading ? 'Creating…' : 'Create payment intent'}
          </Button>
        </div>

        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Stripe checkout</div>
        <div className="mt-1 text-xs text-slate-500">
          Clicking “Create payment intent” will redirect you to Stripe to complete your payment. After payment, refresh Appointments to see the updated status.
        </div>
      </Card>
    </div>
  )
}
