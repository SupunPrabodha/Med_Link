import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatApiError } from '../lib/formatApiError'
import { useToast } from '../ui/toast'

export function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      nav('/app/dashboard')
    } catch (err: any) {
      toast.error(formatApiError(err, 'Invalid email or password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ─── Left Hero Panel ───────────────────────────────────── */}
      <div className="auth-hero hidden flex-col justify-between p-12 lg:flex lg:w-5/12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-white">MediLink <span className="text-sky-300">LK</span></span>
        </Link>

        {/* Hero text */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-sky-200 backdrop-blur-sm">
            <span className="pulse-dot" />
            AI-Enabled Healthcare
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white">
            Your health,<br />
            <span className="text-sky-300">our priority</span>
          </h1>
          <p className="text-sky-200/70 text-base leading-relaxed">
            Book appointments with verified doctors, join video consultations and get AI health insights — all in one secure place.
          </p>

          {/* Testimonial card */}
          <div className="mt-10 rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/15">
            <p className="text-sm text-white/80 italic">
              "MediLink made it incredibly easy to consult my doctor from home. The video call quality was excellent and my prescription arrived digitally."
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-sky-400/40 flex items-center justify-center text-white font-bold text-sm">P</div>
              <div>
                <div className="text-xs font-semibold text-white">Patient User</div>
                <div className="text-[11px] text-sky-200/60">MediLink LK Member</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom links */}
        <p className="text-xs text-sky-200/50">
          SE3020 Distributed Systems • 2026
        </p>
      </div>

      {/* ─── Right Form Panel ──────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-sky-50/40 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">MediLink LK</span>
          </Link>

          <div className="auth-card">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="mt-1.5 text-sm text-slate-500">Sign in to your MediLink account</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
                <input
                  id="login-email"
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
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-3 focus:ring-sky-100 disabled:bg-slate-50"
                />
              </div>

              <button
                type="submit"
                id="login-submit"
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
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to MediLink?{' '}
              <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-800">
                Create an account
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By signing in you agree to our{' '}
            <span className="text-sky-500">Terms of Service</span> &amp;{' '}
            <span className="text-sky-500">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
