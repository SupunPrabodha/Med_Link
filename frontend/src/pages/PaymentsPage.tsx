import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card, Input, Label } from '../ui/primitives'

type Appointment = {
  id: number
  doctorId: number
  slotTime: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
}

type PaymentIntentResponse = {
  checkoutUrl: string
  formFields: Record<string, string>
}

export function PaymentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState('')
  const [amount, setAmount] = useState('1000')
  const [currency, setCurrency] = useState('LKR')
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null)
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
    setIntent(null)
    setError(null)
  }

  async function createIntent() {
    setLoading(true)
    setError(null)
    setIntent(null)
    try {
      const parsedAppointmentId = Number.parseInt(appointmentId, 10)
      if (!Number.isFinite(parsedAppointmentId) || parsedAppointmentId <= 0) {
        setError('Please select an appointment')
        return
      }

      const res = await api.post<PaymentIntentResponse>('/payments/intents/payhere', {
        appointmentId: parsedAppointmentId,
        amount: amount,
        currency: currency,
      })
      setIntent(res.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to create payment intent'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAppointments()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Payments</div>
            <div className="text-xs text-slate-500">Create a PayHere-style payment intent</div>
          </div>
          <Badge>Patient/Admin role</Badge>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-700">Select an appointment</div>
              <div className="text-xs text-slate-500">Choose a PENDING_PAYMENT appointment from the list</div>
            </div>
            <Button variant="secondary" onClick={loadAppointments} disabled={loadingAppointments}>
              {loadingAppointments ? 'Loading…' : 'Refresh'}
            </Button>
          </div>

          {appointmentsError && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{appointmentsError}</div>
          )}

          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">ID</th>
                  <th className="px-3 py-2 font-semibold">Doctor ID</th>
                  <th className="px-3 py-2 font-semibold">Slot</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((a) => {
                  const isSelected = appointmentId === String(a.id)
                  const payable = a.status === 'PENDING_PAYMENT'
                  return (
                    <tr key={a.id} className={isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.id}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">{a.doctorId}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
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
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      No appointments found. Create an appointment first.
                    </td>
                  </tr>
                )}
                {loadingAppointments && appointments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
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

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
      </Card>

      {intent && (
        <Card>
          <div className="text-sm font-semibold text-slate-900">Checkout</div>
          <div className="mt-2 text-xs text-slate-500">Open the checkout URL or submit the form fields.</div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white" href={intent.checkoutUrl} target="_blank" rel="noreferrer">
              Open PayHere checkout
            </a>
            <Badge className="font-mono">{intent.checkoutUrl}</Badge>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-700">Form fields</div>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-800">{JSON.stringify(intent.formFields, null, 2)}</pre>
          </div>
        </Card>
      )}

      <Card>
        <div className="text-xs text-slate-500">
          API: <span className="font-mono">POST /api/payments/intents/payhere</span>
        </div>
      </Card>
    </div>
  )
}
