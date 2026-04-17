import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { cn } from '../ui/primitives'
import { Home, Bell, Stethoscope, User, Pill, Bot, Calendar, CreditCard, Users, CheckCircle, Lock, Shield, LogOut } from 'lucide-react'

type NavItem = {
  label: string
  to: string
  icon: React.ReactNode
  show?: (roles: string[]) => boolean
}

type NavSection = {
  title: string
  show?: (roles: string[]) => boolean
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard',      to: '/app/dashboard',     icon: <Home className="h-[18px] w-[18px]" /> },
      { label: 'Notifications',  to: '/app/notifications', icon: <Bell className="h-[18px] w-[18px]" />, show: (r) => r.length > 0 },
      { label: 'Browse Doctors', to: '/app/doctors',       icon: <Stethoscope className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    title: 'Patient',
    show: (r) => r.includes('PATIENT'),
    items: [
      { label: 'My Profile',        to: '/app/patient/profile',        icon: <User className="h-[18px] w-[18px]" />, show: (r) => r.includes('PATIENT') },
      { label: 'My Prescriptions',  to: '/app/patient/prescriptions',  icon: <Pill className="h-[18px] w-[18px]" />, show: (r) => r.includes('PATIENT') },
      { label: 'Symptom Checker',   to: '/app/patient/symptoms',       icon: <Bot className="h-[18px] w-[18px]" />, show: (r) => r.includes('PATIENT') },
      { label: 'Appointments',      to: '/app/appointments',           icon: <Calendar className="h-[18px] w-[18px]" />, show: (r) => r.includes('PATIENT') || r.includes('ADMIN') },
      { label: 'Payments',          to: '/app/payments',               icon: <CreditCard className="h-[18px] w-[18px]" />, show: (r) => r.includes('PATIENT') },
    ],
  },
  {
    title: 'Doctor',
    show: (r) => r.includes('DOCTOR'),
    items: [
      { label: 'Doctor Profile',   to: '/app/doctor/profile',        icon: <Stethoscope className="h-[18px] w-[18px]" />, show: (r) => r.includes('DOCTOR') },
      { label: 'Appointments',     to: '/app/doctor/appointments',   icon: <Calendar className="h-[18px] w-[18px]" />,   show: (r) => r.includes('DOCTOR') },
      { label: 'Patient Records',  to: '/app/doctor/patients',       icon: <Users className="h-[18px] w-[18px]" />,   show: (r) => r.includes('DOCTOR') },
      { label: 'Prescriptions',    to: '/app/doctor/prescriptions',  icon: <Pill className="h-[18px] w-[18px]" />,   show: (r) => r.includes('DOCTOR') },
    ],
  },
  {
    title: 'Admin',
    show: (r) => r.includes('ADMIN'),
    items: [
      { label: 'Doctor Verification', to: '/app/admin/doctors',   icon: <CheckCircle className="h-[18px] w-[18px]" />, show: (r) => r.includes('ADMIN') },
      { label: 'All Patients',        to: '/app/admin/patients',  icon: <Users className="h-[18px] w-[18px]" />, show: (r) => r.includes('ADMIN') },
      { label: 'All Payments',        to: '/app/admin/payments',  icon: <CreditCard className="h-[18px] w-[18px]" />, show: (r) => r.includes('ADMIN') },
      { label: 'User Accounts',       to: '/app/admin/users',     icon: <Lock className="h-[18px] w-[18px]" />, show: (r) => r.includes('ADMIN') },
      { label: 'Platform Status',     to: '/app/status',          icon: <Shield className="h-[18px] w-[18px]" />, show: (r) => r.includes('ADMIN') },
    ],
  },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const roles = user?.roles ?? []

  function onLogout() {
    logout()
    nav('/')
  }

  return (
    <div className="flex h-screen w-full bg-[#f0f6ff] font-sans text-slate-900 overflow-hidden relative">

      {/* Background Orbs for the premium feel */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60" style={{
        background: `
          radial-gradient(ellipse at 80% 20%, rgba(14, 165, 233, 0.15) 0%, transparent 40%),
          radial-gradient(ellipse at 30% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 40%)
        `
      }} />

      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white/70 backdrop-blur-3xl border-r border-sky-100/50 shadow-[4px_0_24px_rgba(14,165,233,0.05)] z-20">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-sky-100/50">
          <Link to="/" className="flex flex-1 items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
              </svg>
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              MediLink <span className="text-sky-600">LK</span>
            </span>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
          {navSections.map((section) => {
            if (section.show && !section.show(roles)) return null
            const visibleItems = section.items.filter((i) => (i.show ? i.show(roles) : true))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-1">
                <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                {visibleItems.map((item) => {
                  const active = loc.pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-all duration-200',
                        active 
                          ? 'bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center transition-colors drop-shadow-sm",
                        active ? "text-sky-600" : "text-slate-400 group-hover:text-slate-500"
                      )}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
        
        {/* Mobile Toggle Alternative inside Sidebar (Not strictly needed right now since sidebar is hidden on small screens) */}
      </aside>

      {/* ─── Main Content Wrapper ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col w-0 overflow-hidden relative z-10">

        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-white/40 backdrop-blur-xl border-b border-sky-100/50 flex flex-wrap items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Logo Fallback (if sidebar is hidden) */}
            <Link to="/" className="md:hidden flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-md">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
                </svg>
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">MediLink</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-700 leading-tight">{user.email}</span>
                  <div className="flex gap-1 mt-0.5">
                    {roles.map((r) => (
                      <span key={r} className="text-[9px] font-bold tracking-wide text-white rounded-[4px] px-1.5 py-[2px] leading-none"
                        style={{ background: r === 'ADMIN' ? '#7c3aed' : r === 'DOCTOR' ? '#0f766e' : '#0284c7' }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-200 to-teal-200 border border-sky-100 shadow-sm flex items-center justify-center p-0.5">
                  <div className="h-full w-full rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <User className="h-[18px] w-[18px] text-sky-700" />
                  </div>
                </div>
              </div>
            )}
            <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
            <button
              onClick={onLogout}
              className="group flex items-center justify-center h-9 w-9 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-6xl mx-auto pb-12">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  )
}
