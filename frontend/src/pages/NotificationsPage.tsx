import { useEffect, useState } from 'react'
import { hasRole, useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Select } from '../ui/primitives'

type NotificationRow = {
  id: string
  createdAt: string
  type: string
  message: string
  userId: number | null
}

type Scope = 'mine' | 'all'

export function NotificationsPage() {
  const { user } = useAuth()
  const isAdmin = hasRole(user, 'ADMIN')

  const [scope, setScope] = useState<Scope>('mine')
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh(nextScope?: Scope) {
    const s = nextScope ?? scope
    setLoading(true)
    setError(null)
    try {
      const url = s === 'all' ? '/admin/notifications' : '/notifications'
      const res = await api.get<NotificationRow[]>(url, { params: { limit: s === 'all' ? 200 : 50 } })
      setRows(res.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load notifications'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh('mine')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh()
    }, 10_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Notifications</div>
            <div className="text-xs text-slate-500">Updates from appointments, payments, and verification</div>
          </div>
          <div className="flex items-end gap-2">
            {isAdmin && (
              <div className="min-w-[180px]">
                <Select
                  value={scope}
                  onChange={(e) => {
                    const next = e.target.value as Scope
                    setScope(next)
                    void refresh(next)
                  }}
                >
                  <option value="mine">My notifications</option>
                  <option value="all">All notifications</option>
                </Select>
              </div>
            )}
            <Button variant="secondary" onClick={() => refresh()} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
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
                <th className="px-3 py-2 font-semibold">Time</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                {scope === 'all' && <th className="px-3 py-2 font-semibold">User ID</th>}
                <th className="px-3 py-2 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-xs text-slate-600">{new Date(n.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <Badge className="font-mono">{n.type}</Badge>
                  </td>
                  {scope === 'all' && <td className="px-3 py-3 font-mono text-xs text-slate-700">{n.userId ?? '—'}</td>}
                  <td className="px-3 py-3 text-slate-700">{n.message}</td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={scope === 'all' ? 4 : 3} className="px-3 py-8 text-center text-slate-500">
                    No notifications yet.
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
