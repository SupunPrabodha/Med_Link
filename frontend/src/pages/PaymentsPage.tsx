import { useState } from 'react'
import { api } from '../lib/api'
import { Badge, Button, Card, Input, Label } from '../ui/primitives'

type PaymentIntentResponse = {
  checkoutUrl: string
  formFields: Record<string, string>
}

export function PaymentsPage() {
  const [appointmentId, setAppointmentId] = useState('')
  const [amount, setAmount] = useState('1000')
  const [currency, setCurrency] = useState('LKR')
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function createIntent() {
    setLoading(true)
    setError(null)
    setIntent(null)
    try {
      const res = await api.post<PaymentIntentResponse>('/api/payments/intents/payhere', {
        appointmentId: Number(appointmentId),
        amount: amount,
        currency: currency,
      })
      setIntent(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create payment intent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Payments</div>
            <div className="text-xs text-slate-500">Create a PayHere-style payment intent</div>
          </div>
          <Badge>Patient role</Badge>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <Label>Appointment ID</Label>
            <div className="mt-1">
              <Input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} placeholder="e.g., 1" />
            </div>
          </div>
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
