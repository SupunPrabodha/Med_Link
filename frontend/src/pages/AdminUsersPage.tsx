import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label } from '../ui/primitives'

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'

type UserRow = {
  id: number
  email: string
  role: Role
}

export function AdminUsersPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const query = q.trim()
      const res = await api.get<UserRow[]>('/admin/users', {
        params: query ? { q: query } : undefined,
      })
      setRows(res.data)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load users'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">User management</div>
            <div className="text-xs text-slate-500">Admin-only overview of registered accounts</div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <div>
              <Label>Search by email</Label>
              <div className="mt-1">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g., demo@site.com" disabled={loading} />
              </div>
            </div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Search'}
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
                <th className="px-3 py-2 font-semibold">User ID</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{u.id}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{u.email}</td>
                  <td className="px-3 py-3">
                    <Badge>{u.role}</Badge>
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}

              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Note: this is a read-only list of accounts (credentials are never exposed).
        </div>
      </Card>
    </div>
  )
}
