import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Button, Card, Input, Label, Select } from '../ui/primitives'

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'

export function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('PATIENT')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(email.trim(), password, role)
      nav(role === 'DOCTOR' ? '/app/doctor/profile' : role === 'ADMIN' ? '/app/admin/doctors' : '/app')
    } catch (err: any) {
      setError(formatApiError(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-12">
        <div>
          <div className="text-sm font-semibold text-slate-900">MediLink LK</div>
          <div className="text-xs text-slate-500">Create your account</div>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label>Email</Label>
              <div className="mt-1">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@demo.com" required />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="mt-1">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 1 char" required />
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <div className="mt-1">
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={loading}
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin (demo)</option>
                </Select>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Doctor accounts require admin verification. Admin accounts are for demo use only.
              </div>
            </div>

            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline underline-offset-4">
            Sign in
          </Link>
        </div>

        <div className="text-center text-xs">
          <Link to="/" className="text-slate-600 underline underline-offset-4">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
