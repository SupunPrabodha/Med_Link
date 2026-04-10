import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { Badge, Button, cn, Divider } from '../ui/primitives'

function SideLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'block rounded-lg px-3 py-2 text-sm font-medium',
          isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
        )
      }
    >
      {label}
    </NavLink>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const role = user?.roles?.[0] ?? 'PATIENT'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-64 flex-none rounded-xl border border-slate-200 bg-white p-4 md:block">
          <Link to="/" className="block">
            <div className="text-sm font-semibold text-slate-900">MediLink LK</div>
            <div className="text-xs text-slate-500">Gateway-driven microservices UI</div>
          </Link>

          <div className="mt-4 flex items-center justify-between">
            <Badge>{role}</Badge>
            <Badge className="font-mono">UID {user?.uid}</Badge>
          </div>

          <div className="mt-4">
            <Divider />
          </div>

          <nav className="mt-4 space-y-1">
            <SideLink to="/app/dashboard" label="Dashboard" />
            <SideLink to="/app/status" label="System status" />
            <SideLink to="/app/doctors" label="Doctors" />
            <SideLink to="/app/appointments" label="Appointments" />
            {hasRole(user, 'PATIENT') && <SideLink to="/app/payments" label="Payments" />}
            {hasRole(user, 'DOCTOR') && <SideLink to="/app/doctor/profile" label="My doctor profile" />}
            {hasRole(user, 'ADMIN') && <SideLink to="/app/admin/doctors" label="Doctor verification" />}
          </nav>

          <div className="mt-6">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                logout()
                nav('/login')
              }}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Welcome back</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
              <div className="flex items-center gap-2 md:hidden">
                <Badge>{role}</Badge>
                <Button
                  variant="secondary"
                  onClick={() => {
                    logout()
                    nav('/login')
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </header>

          <Outlet />

          <footer className="mt-10 pb-6 text-center text-xs text-slate-500">
            UI talks to <span className="font-mono">{import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090'}</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
