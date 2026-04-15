import { useEffect, useState } from 'react'
import axios from 'axios'
import { api } from '../lib/api'
import { Badge, Button, Card, Divider } from '../ui/primitives'

type PingRow = { name: string; url: string; requiresAuth?: boolean }

const pings: PingRow[] = [
  { name: 'Gateway', url: '/actuator/health', requiresAuth: false },
  { name: 'Auth', url: '/auth/login', requiresAuth: false },
  { name: 'Appointment', url: '/appointments/ping', requiresAuth: true },
  { name: 'Doctor', url: '/doctors/ping', requiresAuth: true },
  { name: 'Payment', url: '/payments/ping', requiresAuth: true },
  { name: 'Patient', url: '/patients/ping', requiresAuth: true },
  { name: 'Telemedicine', url: '/telemedicine/ping', requiresAuth: true },
]

export function SystemStatusPage() {
  const [results, setResults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    const out: Record<string, string> = {}
    for (const p of pings) {
      try {
        if (p.url === '/auth/login') {
          out[p.name] = 'OK'
          continue
        }
        const res = p.url.startsWith('/actuator/') ? await axios.get(p.url) : await api.get(p.url)
        if (p.url === '/actuator/health') {
          const status = (res.data as any)?.status
          out[p.name] = typeof status === 'string' ? status : 'OK'
        } else {
          out[p.name] = 'OK'
        }
      } catch (err: any) {
        out[p.name] = err?.response?.status ? `HTTP ${err.response.status}` : 'Error'
      }
    }
    setResults(out)
    setLoading(false)
  }

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Platform status</div>
          <div className="text-xs text-slate-500">Service health checks</div>
        </div>
        <Button variant="secondary" onClick={run} disabled={loading}>
          {loading ? 'Checking…' : 'Re-check'}
        </Button>
      </div>

      <div className="mt-4">
        <Divider />
      </div>

      <div className="mt-4 space-y-3">
        {pings.map((p) => (
          <div key={p.name} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">{p.name}</div>
              <div className="flex items-center gap-2">
                {p.requiresAuth ? <Badge>Auth</Badge> : <Badge>No auth</Badge>}
                <Badge className="font-mono">{p.url}</Badge>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-700">
              {results[p.name] ? <span className="font-mono">{results[p.name]}</span> : <span className="text-slate-500">—</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
