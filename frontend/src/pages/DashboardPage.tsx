import { Link } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { DoctorBookedAppointmentsCard } from '../components/DoctorBookedAppointmentsCard'
import { Badge, Button, Card } from '../ui/primitives'

export function DashboardPage() {
  const { user } = useAuth()

  const roles = user?.roles ?? []

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-900">Account</div>
              <div className="text-xs text-slate-500">You’re signed in and ready to go</div>
            </div>
            <Badge className="border-teal-200 bg-teal-50 text-teal-800">Signed in</Badge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-white/70 px-3 py-2">
              <span className="text-slate-600">Email</span>
              <span className="font-mono text-xs text-slate-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-white/70 px-3 py-2">
              <span className="text-slate-600">Account ID</span>
              <span className="font-mono text-xs text-slate-900">{user?.uid}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-white/70 px-3 py-2">
              <span className="text-slate-600">Roles</span>
              <span className="font-mono text-xs text-slate-900">{roles.join(', ')}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold tracking-wide text-slate-900">Quick actions</div>
          <div className="mt-1 text-xs text-slate-500">Shortcuts based on your role</div>

          <div className="mt-4 grid gap-2.5">
            {(hasRole(user, 'PATIENT') || hasRole(user, 'ADMIN')) && (
              <Link to="/app/patient/profile">
                <Button variant="secondary" className="w-full">
                  Manage profile & reports
                </Button>
              </Link>
            )}
            <Link to="/app/doctors">
              <Button variant="secondary" className="w-full">
                Browse doctors
              </Button>
            </Link>

            {(hasRole(user, 'PATIENT') || hasRole(user, 'ADMIN')) && (
              <Link to="/app/appointments">
                <Button variant="secondary" className="w-full">
                  Book / manage appointments
                </Button>
              </Link>
            )}

            {(hasRole(user, 'PATIENT') || hasRole(user, 'ADMIN')) && (
              <Link to="/app/payments">
                <Button variant="secondary" className="w-full">
                  Pay for an appointment
                </Button>
              </Link>
            )}

            {hasRole(user, 'DOCTOR') && (
              <Link to="/app/doctor/profile">
                <Button variant="secondary" className="w-full">
                  Manage doctor profile
                </Button>
              </Link>
            )}

            {hasRole(user, 'DOCTOR') && (
              <Link to="/app/doctor/appointments">
                <Button variant="secondary" className="w-full">
                  View my appointments
                </Button>
              </Link>
            )}

            {hasRole(user, 'DOCTOR') && (
              <Link to="/app/doctor/patients">
                <Button variant="secondary" className="w-full">
                  View patients & reports
                </Button>
              </Link>
            )}

            {hasRole(user, 'ADMIN') && (
              <Link to="/app/admin/doctors">
                <Button variant="secondary" className="w-full">
                  Verify doctor registrations
                </Button>
              </Link>
            )}

            {hasRole(user, 'ADMIN') && (
              <Link to="/app/status">
                <Button variant="secondary" className="w-full">
                  View platform status
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>

      {hasRole(user, 'DOCTOR') && <DoctorBookedAppointmentsCard />}
    </div>
  )
}
