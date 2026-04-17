import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { DoctorBookedAppointmentsCard } from '../components/DoctorBookedAppointmentsCard'
import { api } from '../lib/api'
import { Calendar, Bell, Pill, CreditCard, User, Stethoscope, Bot, Users, CheckCircle, Shield, Lock, MonitorPlay, Settings, ArrowRight } from 'lucide-react'

type StatWidget = {
  label: string
  value: string | number
  icon: React.ReactNode
  gradient: string
  shadow: string
  link?: string
}

function useDashboardStats(isPatient: boolean, isDoctor: boolean, isAdmin: boolean) {
  const [apptCount, setApptCount] = useState<number | null>(null)
  const [notifCount, setNotifCount] = useState<number | null>(null)
  const [prescCount, setPrescCount] = useState<number | null>(null)
  const [paymentCount, setPaymentCount] = useState<number | null>(null)

  useEffect(() => {
    if (isPatient || isAdmin) {
      api.get<any[]>(isAdmin ? '/admin/appointments' : '/appointments')
        .then((r) => setApptCount(r.data?.length ?? 0))
        .catch(() => setApptCount(0))
    }
    if (isDoctor) {
      api.get<any[]>('/appointments/doctor/me')
        .then((r) => setApptCount(r.data?.filter((a: any) => a.status !== 'CANCELLED').length ?? 0))
        .catch(() => setApptCount(0))
    }
    api.get<any[]>('/notifications')
      .then((r) => setNotifCount(r.data?.length ?? 0))
      .catch(() => setNotifCount(0))

    if (isPatient) {
      api.get<any[]>('/prescriptions/patient/me')
        .then((r) => setPrescCount(r.data?.length ?? 0))
        .catch(() => setPrescCount(0))
      api.get<any[]>('/payments')
        .then((r) => setPaymentCount(r.data?.length ?? 0))
        .catch(() => setPaymentCount(0))
    }
    if (isDoctor) {
      api.get<any[]>('/prescriptions/doctor/me')
        .then((r) => setPrescCount(r.data?.length ?? 0))
        .catch(() => setPrescCount(0))
    }
    if (isAdmin) {
      api.get<any[]>('/admin/payments')
        .then((r) => setPaymentCount(r.data?.length ?? 0))
        .catch(() => setPaymentCount(0))
    }
  }, [isPatient, isDoctor, isAdmin])

  return { apptCount, notifCount, prescCount, paymentCount }
}

export function DashboardPage() {
  const { user } = useAuth()

  const isPatient = hasRole(user, 'PATIENT')
  const isDoctor  = hasRole(user, 'DOCTOR')
  const isAdmin   = hasRole(user, 'ADMIN')
  const roles     = user?.roles ?? []

  const { apptCount, notifCount, prescCount, paymentCount } = useDashboardStats(isPatient, isDoctor, isAdmin)

  const stats: StatWidget[] = [
    ...(apptCount != null ? [{
      label: isAdmin ? 'Total Appointments' : 'My Appointments',
      value: apptCount,
      icon: <Calendar className="h-8 w-8 text-white/90" />,
      gradient: 'from-sky-500 to-blue-600',
      shadow: 'rgba(14,165,233,0.3)',
      link: isAdmin ? '/app/appointments' : isDoctor ? '/app/doctor/appointments' : '/app/appointments',
    }] : []),
    ...(notifCount != null ? [{
      label: 'Notifications',
      value: notifCount,
      icon: <Bell className="h-8 w-8 text-white/90" />,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'rgba(139,92,246,0.3)',
      link: '/app/notifications',
    }] : []),
    ...(prescCount != null ? [{
      label: 'Prescriptions',
      value: prescCount,
      icon: <Pill className="h-8 w-8 text-white/90" />,
      gradient: 'from-teal-500 to-emerald-600',
      shadow: 'rgba(15,118,110,0.3)',
      link: isDoctor ? '/app/doctor/prescriptions' : '/app/patient/prescriptions',
    }] : []),
    ...(paymentCount != null ? [{
      label: 'Payments',
      value: paymentCount,
      icon: <CreditCard className="h-8 w-8 text-white/90" />,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'rgba(245,158,11,0.3)',
      link: isAdmin ? '/app/admin/payments' : '/app/payments',
    }] : []),
  ]

  const quickActions = [
    { show: isPatient || isAdmin, icon: <User className="h-4 w-4" />, label: 'Manage Profile & Reports', to: '/app/patient/profile' },
    { show: true,                 icon: <Stethoscope className="h-4 w-4" />, label: 'Browse Doctors',           to: '/app/doctors' },
    { show: isPatient || isAdmin, icon: <Calendar className="h-4 w-4" />, label: 'Book / Manage Appointments', to: '/app/appointments' },
    { show: isPatient || isAdmin, icon: <CreditCard className="h-4 w-4" />, label: 'Pay for Appointment',       to: '/app/payments' },
    { show: isPatient,            icon: <Bot className="h-4 w-4" />, label: 'AI Symptom Checker',        to: '/app/patient/symptoms' },
    { show: isPatient,            icon: <Pill className="h-4 w-4" />, label: 'View Prescriptions',        to: '/app/patient/prescriptions' },
    { show: isDoctor,             icon: <Stethoscope className="h-4 w-4" />, label: 'My Doctor Profile',        to: '/app/doctor/profile' },
    { show: isDoctor,             icon: <Calendar className="h-4 w-4" />, label: 'My Appointments',           to: '/app/doctor/appointments' },
    { show: isDoctor,             icon: <Users className="h-4 w-4" />, label: 'View Patient Records',      to: '/app/doctor/patients' },
    { show: isDoctor,             icon: <Pill className="h-4 w-4" />, label: 'Issue Prescription',        to: '/app/doctor/prescriptions' },
    { show: isAdmin,              icon: <CheckCircle className="h-4 w-4" />, label: 'Verify Doctor Registrations', to: '/app/admin/doctors' },
    { show: isAdmin,              icon: <Shield className="h-4 w-4" />, label: 'Platform Status',           to: '/app/status' },
  ].filter((a) => a.show)

  return (
    <div className="space-y-6">

      {/* ─── Welcome Banner ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg,#0c1a2e,#0f3460)', boxShadow: '0 8px 32px rgba(14,165,233,0.18)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Platform Active
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="mt-1 text-sm text-sky-200/70">
              MediLink LK — AI-Enabled Smart Healthcare Platform
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <span
                key={r}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: 'rgba(14,165,233,0.25)', border: '1px solid rgba(14,165,233,0.4)' }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Account meta */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-sky-200/60">
          <span>📧 {user?.email}</span>
          <span>🆔 Account #{user?.uid}</span>
        </div>
      </div>

      {/* ─── Stat Widgets ───────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <Link to={s.link ?? '#'} key={s.label}>
              <div
                className="stat-widget rounded-2xl text-white transition-all hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg,var(--tw-gradient-from),var(--tw-gradient-to))`,
                  backgroundImage: `linear-gradient(135deg,${s.gradient.includes('sky') ? '#0ea5e9,#2563eb' : s.gradient.includes('violet') ? '#8b5cf6,#7c3aed' : s.gradient.includes('teal') ? '#14b8a6,#059669' : '#f59e0b,#ea580c'})`,
                  boxShadow: `0 4px 20px ${s.shadow}`,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div className="mb-2">{s.icon}</div>
                <div className="text-3xl font-extrabold leading-none">
                  {s.value != null ? s.value : '—'}
                </div>
                <div className="mt-1 text-xs font-medium text-white/75">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ─── Quick Actions + Account Info ───────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <div className="hospital-panel p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900">Quick Actions</div>
            <div className="text-xs text-slate-500">Shortcuts based on your role</div>
          </div>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
              >
                <div className="flex items-center gap-2">
                  <div className="text-slate-400 group-hover:text-sky-500 transition-colors">{a.icon}</div>
                  <span>{a.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Platform services */}
        <div className="hospital-panel p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900">Platform Services</div>
            <div className="text-xs text-slate-500">Active microservices powering MediLink</div>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Auth Service', port: '8081', icon: <Lock className="h-4 w-4" /> },
              { name: 'Patient Service', port: '8086', icon: <User className="h-4 w-4" /> },
              { name: 'Doctor Service', port: '8084', icon: <Stethoscope className="h-4 w-4" /> },
              { name: 'Appointment Service', port: '8082', icon: <Calendar className="h-4 w-4" /> },
              { name: 'Payment Service', port: '8085', icon: <CreditCard className="h-4 w-4" /> },
              { name: 'Telemedicine Service', port: '8087', icon: <MonitorPlay className="h-4 w-4" /> },
              { name: 'Notification Service', port: '8083', icon: <Bell className="h-4 w-4" /> },
              { name: 'Prescription Service', port: '8088', icon: <Pill className="h-4 w-4" /> },
              { name: 'Symptom Checker', port: '8089', icon: <Bot className="h-4 w-4" /> },
            ].map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/70 px-4 py-2.5"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <span className="text-slate-400">{svc.icon}</span>
                  <span>{svc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs text-slate-400">:{svc.port}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Doctor: Booked Appointments Card ───────────────────── */}
      {isDoctor && <DoctorBookedAppointmentsCard />}
    </div>
  )
}
