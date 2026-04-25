import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { DoctorBookedAppointmentsCard } from '../components/DoctorBookedAppointmentsCard'
import { api } from '../lib/api'
import { Calendar, Bell, Pill, CreditCard, User, Stethoscope, Bot, Users, CheckCircle, Shield, Lock, MonitorPlay, BarChart3, Download, ArrowRight } from 'lucide-react'
import { Alert, Badge, Button, Card, Divider } from '../ui/primitives'

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'

type UserRow = {
  id: number
  email: string
  role: Role
}

type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

type PaymentRow = {
  id: number
  orderId: string
  appointmentId: number
  patientId: number
  amount: number
  currency: string
  status: PaymentStatus
  providerRef: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  failedAt: string | null
  reviewedAt?: string | null
  reviewedByAdminUserId?: number | null
  reviewNote?: string | null
  disputedAt?: string | null
  disputedByAdminUserId?: number | null
  disputeNote?: string | null
  refundedAt?: string | null
  refundedByAdminUserId?: number | null
  refundNote?: string | null
}

type AppointmentStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'

type AppointmentRow = {
  id: number
  patientId: number
  doctorId: number
  slotTime: string
  status: AppointmentStatus
  appoinmentApproval?: string | null
}

type SymptomCheckRow = {
  id: number
  createdAt: string
  riskLevel: string
  summary: string
  advice: string
  recommendedSpecialties: string[]
}

type DoctorProfile = {
  id: number
  userId: number
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

type AdminAnalyticsState = {
  users: UserRow[]
  payments: PaymentRow[]
  appointments: AppointmentRow[]
  symptomChecks: SymptomCheckRow[]
  pendingDoctors: DoctorProfile[]
  loadedAt: string
}

function sumBy<T>(items: T[], select: (t: T) => number) {
  let out = 0
  for (const i of items) out += select(i) || 0
  return out
}

function formatMoney(amount: number, currency: string) {
  const safe = Number.isFinite(amount) ? amount : 0
  try {
    const locale = currency?.toUpperCase?.() === 'LKR' ? 'en-LK' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'LKR',
      maximumFractionDigits: 0,
    }).format(safe)
  } catch {
    return `${safe} ${currency || 'LKR'}`
  }
}

function downloadText(content: string, fileName: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeCsvCell(v: unknown) {
  const s = v == null ? '' : String(v)
  if (/[\r\n",]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values.map((v) => (Number.isFinite(v) ? v : 0)))
  return (
    <div className="flex h-14 items-end gap-1">
      {values.map((v, idx) => {
        const safe = Number.isFinite(v) ? v : 0
        const pct = Math.max(0, Math.min(100, Math.round((safe / max) * 100)))
        return (
          <div key={idx} className="flex-1 rounded-md bg-sky-100">
            <div className="w-full rounded-md bg-gradient-to-t from-sky-500 to-blue-600" style={{ height: `${pct}%` }} />
          </div>
        )
      })}
    </div>
  )
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const denom = total > 0 ? total : 1
  const pct = Math.round((value / denom) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="font-semibold text-slate-700">{label}</div>
        <div className="font-mono text-slate-500">
          {value} / {total} ({pct}%)
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  )
}

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

  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminData, setAdminData] = useState<AdminAnalyticsState | null>(null)

  async function loadAdminAnalytics() {
    setAdminLoading(true)
    setAdminError(null)

    const results = await Promise.allSettled([
      api.get<UserRow[]>('/admin/users'),
      api.get<PaymentRow[]>('/admin/payments'),
      api.get<AppointmentRow[]>('/admin/appointments'),
      api.get<SymptomCheckRow[]>('/admin/symptoms'),
      api.get<DoctorProfile[]>('/admin/doctors/pending'),
    ])

    const users = results[0].status === 'fulfilled' ? results[0].value.data : []
    const payments = results[1].status === 'fulfilled' ? results[1].value.data : []
    const appointments = results[2].status === 'fulfilled' ? results[2].value.data : []
    const symptomChecks = results[3].status === 'fulfilled' ? results[3].value.data : []
    const pendingDoctors = results[4].status === 'fulfilled' ? results[4].value.data : []

    const failed = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === 'rejected')
      .map(({ i }) => ['Users', 'Payments', 'Appointments', 'Symptoms', 'Pending doctors'][i])

    if (failed.length > 0) {
      setAdminError(`Some analytics sources failed to load: ${failed.join(', ')}`)
    }

    setAdminData({
      users,
      payments,
      appointments,
      symptomChecks,
      pendingDoctors,
      loadedAt: new Date().toISOString(),
    })
    setAdminLoading(false)
  }

  useEffect(() => {
    if (!isAdmin) return
    void loadAdminAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const adminKpis = useMemo(() => {
    if (!adminData) return null

    const paymentsCompleted = adminData.payments.filter((p) => p.status === 'COMPLETED')
    const paymentsRefunded = paymentsCompleted.filter((p) => !!p.refundedAt)
    const grossRevenue = sumBy(paymentsCompleted, (p) => p.amount)
    const refunds = sumBy(paymentsRefunded, (p) => p.amount)
    const netIncome = grossRevenue - refunds
    const currency = paymentsCompleted.find((p) => p.currency)?.currency ?? 'LKR'

    const now = Date.now()
    const days = 7
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))

    const dayKeys: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dayKeys.push(d.toISOString().slice(0, 10))
    }

    const revenueLast7 = dayKeys.map((k) => {
      const total = paymentsCompleted
        .filter((p) => {
          const t = p.completedAt ?? p.createdAt
          return typeof t === 'string' && t.slice(0, 10) === k
        })
        .reduce((acc, p) => acc + (p.amount || 0), 0)
      return total
    })

    const symptomsLast7 = dayKeys.map((k) =>
      adminData.symptomChecks.filter((s) => typeof s.createdAt === 'string' && s.createdAt.slice(0, 10) === k).length,
    )

    const riskLast7 = adminData.symptomChecks
      .filter((s) => {
        const t = Date.parse(s.createdAt)
        return Number.isFinite(t) && t >= start.getTime() && t <= now
      })
      .reduce(
        (acc, s) => {
          const k = (s.riskLevel || 'UNKNOWN').toUpperCase()
          acc[k] = (acc[k] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

    const apptStatusCounts = adminData.appointments.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1
        return acc
      },
      {} as Record<AppointmentStatus, number>,
    )

    const upcoming7dConfirmed = adminData.appointments.filter((a) => {
      if (a.status !== 'CONFIRMED') return false
      const t = Date.parse(a.slotTime)
      if (!Number.isFinite(t)) return false
      const diff = t - now
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
    }).length

    const usersByRole = adminData.users.reduce(
      (acc, u) => {
        acc[u.role] = (acc[u.role] ?? 0) + 1
        return acc
      },
      {} as Record<Role, number>,
    )

    return {
      currency,
      grossRevenue,
      refunds,
      netIncome,
      paymentsCompletedCount: paymentsCompleted.length,
      paymentsRefundedCount: paymentsRefunded.length,
      paymentsTotalCount: adminData.payments.length,
      pendingDoctorsCount: adminData.pendingDoctors.length,
      appointmentsTotalCount: adminData.appointments.length,
      apptStatusCounts,
      upcoming7dConfirmed,
      usersByRole,
      revenueLast7,
      symptomsLast7,
      riskLast7,
      dayKeys,
    }
  }, [adminData])

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

      {/* ─── Admin: Analytics & Reports ─────────────────────────── */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BarChart3 className="h-4 w-4 text-sky-600" />
                Analytics & Reports
              </div>
              <div className="mt-1 text-xs text-slate-500">Net income, operational progress, and downloadable admin reports</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {adminData?.loadedAt && <Badge className="font-mono">Updated {new Date(adminData.loadedAt).toLocaleString()}</Badge>}
              <Button variant="secondary" onClick={loadAdminAnalytics} disabled={adminLoading}>
                {adminLoading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </div>

          {adminError && <Alert tone="warning">{adminError}</Alert>}

          {!adminData || !adminKpis ? (
            <Card>
              <div className="text-sm font-semibold text-slate-900">Loading analytics…</div>
              <div className="mt-1 text-xs text-slate-500">Fetching admin metrics from services.</div>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">Net income</div>
                    <Badge>FINANCE</Badge>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatMoney(adminKpis.netIncome, adminKpis.currency)}</div>
                  <div className="mt-1 text-xs text-slate-500">Completed payments minus refunds</div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">Gross revenue</div>
                    <Badge>COMPLETED</Badge>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatMoney(adminKpis.grossRevenue, adminKpis.currency)}</div>
                  <div className="mt-1 text-xs text-slate-500">{adminKpis.paymentsCompletedCount} completed payments</div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">Refunds</div>
                    <Badge>REFUNDS</Badge>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatMoney(adminKpis.refunds, adminKpis.currency)}</div>
                  <div className="mt-1 text-xs text-slate-500">{adminKpis.paymentsRefundedCount} refunded payments</div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">Pending doctor verifications</div>
                    <Badge>WORKFLOW</Badge>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{adminKpis.pendingDoctorsCount}</div>
                  <div className="mt-1 text-xs text-slate-500">Awaiting admin decision</div>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Revenue trend (last 7 days)</div>
                      <div className="text-xs text-slate-500">Completed payments by day</div>
                    </div>
                    <Badge className="font-mono">{adminKpis.currency}</Badge>
                  </div>
                  <div className="mt-4">
                    <MiniBars values={adminKpis.revenueLast7} />
                    <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">
                      {adminKpis.dayKeys.map((k) => (
                        <div key={k}>{k.slice(5)}</div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Symptom checks (last 7 days)</div>
                      <div className="text-xs text-slate-500">Usage volume with risk distribution</div>
                    </div>
                    <Badge>AI TRIAGE</Badge>
                  </div>
                  <div className="mt-4">
                    <MiniBars values={adminKpis.symptomsLast7} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(adminKpis.riskLast7)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([k, v]) => (
                          <Badge key={k} className="font-mono">
                            {k}:{v}
                          </Badge>
                        ))}
                      {Object.keys(adminKpis.riskLast7).length === 0 && <span className="text-xs text-slate-500">No checks in this period.</span>}
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Operational progress</div>
                    <div className="text-xs text-slate-500">Appointments, upcoming workload, and user distribution</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{adminKpis.appointmentsTotalCount} appointments</Badge>
                    <Badge>{adminKpis.upcoming7dConfirmed} confirmed in next 7d</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-600">Appointment pipeline</div>
                    <Divider />
                    <ProgressRow label="Pending payment" value={adminKpis.apptStatusCounts.PENDING_PAYMENT ?? 0} total={adminKpis.appointmentsTotalCount} />
                    <ProgressRow label="Confirmed" value={adminKpis.apptStatusCounts.CONFIRMED ?? 0} total={adminKpis.appointmentsTotalCount} />
                    <ProgressRow label="Cancelled" value={adminKpis.apptStatusCounts.CANCELLED ?? 0} total={adminKpis.appointmentsTotalCount} />
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-600">Accounts by role</div>
                    <Divider />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-100 bg-white/70 p-4">
                        <div className="text-xs font-semibold text-slate-500">Patients</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-900">{adminKpis.usersByRole.PATIENT ?? 0}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white/70 p-4">
                        <div className="text-xs font-semibold text-slate-500">Doctors</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-900">{adminKpis.usersByRole.DOCTOR ?? 0}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white/70 p-4">
                        <div className="text-xs font-semibold text-slate-500">Admins</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-900">{adminKpis.usersByRole.ADMIN ?? 0}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">Tip: use User Management for account-level actions.</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Report generation</div>
                    <div className="text-xs text-slate-500">Download a professional executive summary for audits and presentations</div>
                  </div>
                  <Badge className="font-mono">v1</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      const report = {
                        generatedAt: new Date().toISOString(),
                        kpis: {
                          currency: adminKpis.currency,
                          netIncome: adminKpis.netIncome,
                          grossRevenue: adminKpis.grossRevenue,
                          refunds: adminKpis.refunds,
                          paymentsTotalCount: adminKpis.paymentsTotalCount,
                          paymentsCompletedCount: adminKpis.paymentsCompletedCount,
                          paymentsRefundedCount: adminKpis.paymentsRefundedCount,
                          pendingDoctorsCount: adminKpis.pendingDoctorsCount,
                          appointmentsTotalCount: adminKpis.appointmentsTotalCount,
                          appointmentStatusCounts: adminKpis.apptStatusCounts,
                          upcoming7dConfirmed: adminKpis.upcoming7dConfirmed,
                          usersByRole: adminKpis.usersByRole,
                          revenueLast7Days: adminKpis.revenueLast7,
                          symptomChecksLast7Days: adminKpis.symptomsLast7,
                          symptomRiskCountsLast7Days: adminKpis.riskLast7,
                        },
                        notes: {
                          netIncomeDefinition: 'Completed payments minus refunded amounts (based on current payment records)',
                        },
                      }
                      downloadText(JSON.stringify(report, null, 2), `medilink-admin-report-${new Date().toISOString().slice(0, 10)}.json`, 'application/json;charset=utf-8')
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download JSON
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      const rows = [
                        ['generatedAt', new Date().toISOString()],
                        ['currency', adminKpis.currency],
                        ['netIncome', adminKpis.netIncome],
                        ['grossRevenue', adminKpis.grossRevenue],
                        ['refunds', adminKpis.refunds],
                        ['paymentsTotalCount', adminKpis.paymentsTotalCount],
                        ['paymentsCompletedCount', adminKpis.paymentsCompletedCount],
                        ['paymentsRefundedCount', adminKpis.paymentsRefundedCount],
                        ['pendingDoctorsCount', adminKpis.pendingDoctorsCount],
                        ['appointmentsTotalCount', adminKpis.appointmentsTotalCount],
                        ['appointmentsPendingPayment', adminKpis.apptStatusCounts.PENDING_PAYMENT ?? 0],
                        ['appointmentsConfirmed', adminKpis.apptStatusCounts.CONFIRMED ?? 0],
                        ['appointmentsCancelled', adminKpis.apptStatusCounts.CANCELLED ?? 0],
                        ['upcoming7dConfirmed', adminKpis.upcoming7dConfirmed],
                        ['usersPatients', adminKpis.usersByRole.PATIENT ?? 0],
                        ['usersDoctors', adminKpis.usersByRole.DOCTOR ?? 0],
                        ['usersAdmins', adminKpis.usersByRole.ADMIN ?? 0],
                      ]
                      const csv = ['metric,value', ...rows.map((r) => `${escapeCsvCell(r[0])},${escapeCsvCell(r[1])}`)].join('\n')
                      downloadText(csv, `medilink-admin-report-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Net income is computed from completed payments minus refunded payments. If you need true cost-based net profit, we’d add an expense model.
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
