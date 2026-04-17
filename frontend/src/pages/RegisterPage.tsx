import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatApiError } from '../lib/formatApiError'

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'

const roles: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'PATIENT', label: 'Patient', icon: '🧑‍⚕️', desc: 'Book appointments & receive care' },
  { value: 'DOCTOR', label: 'Doctor', icon: '👨‍⚕️', desc: 'Manage consultations & prescriptions' },
  { value: 'ADMIN', label: 'Admin', icon: '🛡️', desc: 'Oversee platform operations' },
]

export function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('PATIENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register(email, password, role)
      nav('/app/dashboard')
    } catch (err: any) {
      setError(formatApiError(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ─── Left Hero Panel ───────────────────────────────────── */}
      <div className="auth-hero hidden flex-col justify-between p-12 lg:flex lg:w-5/12">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-white">MediLink <span className="text-sky-300">LK</span></span>
        </Link>

        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-sky-200 backdrop-blur-sm">
            <span className="pulse-dot" />
            Join Thousands of Users
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white">
            Start your<br />
            <span className="text-sky-300">healthcare journey</span>
          </h1>
          <p className="text-sky-200/70 text-base leading-relaxed">
            Register in seconds. Book your first appointment, join a video consultation, or manage your team on MediLink LK.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-3">
            {[
              { icon: '✓', text: 'Free to register for all roles' },
              { icon: '✓', text: 'Secure JWT authentication' },
              { icon: '✓', text: 'Instant access to all features' },
              { icon: '✓', text: 'AI symptom checker included' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-sky-100/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sky-200/50">SE3020 Distributed Systems • 2026</p>
      </div>

      {/* ─── Right Form Panel ──────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-sky-50/40 px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">MediLink LK</span>
          </Link>

          <div className="auth-card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
              <p className="mt-1.5 text-sm text-slate-500">Join MediLink LK — it's free</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              {/* Role selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">I am a…</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className="flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all duration-150"
                      style={
                        role === r.value
                          ? { borderColor: '#0ea5e9', background: '#f0f9ff', boxShadow: '0 0 0 3px rgba(14,165,233,0.12)' }
                          : { borderColor: '#e2e8f0', background: '#fff' }
                      }
                    >
                      <span className="text-xl">{r.icon}</span>
                      <span className={`mt-1 text-xs font-semibold ${role === r.value ? 'text-sky-700' : 'text-slate-600'}`}>
                        {r.label}
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-400 leading-tight">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-3 focus:ring-sky-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-3 focus:ring-sky-100 disabled:bg-slate-50"
                />
              </div>

              <button
                id="register-submit"
                type="submit"
                disabled={loading || !email || !password}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Creating account…
                  </span>
                ) : `Create ${role.charAt(0) + role.slice(1).toLowerCase()} Account`}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-800">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
