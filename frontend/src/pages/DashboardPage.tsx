import { hasRole, useAuth } from '../context/AuthContext'
import { Badge, Card } from '../ui/primitives'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Session</div>
            <div className="text-xs text-slate-500">JWT-based auth (gateway enforced)</div>
          </div>
          <Badge>Active</Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Email</span>
            <span className="font-mono text-xs text-slate-900">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">UID</span>
            <span className="font-mono text-xs text-slate-900">{user?.uid}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Roles</span>
            <span className="font-mono text-xs text-slate-900">{(user?.roles ?? []).join(', ')}</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Workflow checklist</div>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Doctor search</span>
            <Badge>GET /api/doctors</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Appointments</span>
            <Badge>POST/GET /api/appointments</Badge>
          </div>
          {hasRole(user, 'PATIENT') && (
            <div className="flex items-center justify-between">
              <span>Payment intent</span>
              <Badge>POST /api/payments/intents/payhere</Badge>
            </div>
          )}
          {hasRole(user, 'DOCTOR') && (
            <div className="flex items-center justify-between">
              <span>Doctor onboarding</span>
              <Badge>POST /api/doctors/me/profile</Badge>
            </div>
          )}
          {hasRole(user, 'ADMIN') && (
            <div className="flex items-center justify-between">
              <span>Doctor verification</span>
              <Badge>/api/admin/doctors/*</Badge>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
