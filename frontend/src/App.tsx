import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { DoctorsPage } from './pages/DoctorsPage'
import { DoctorProfilePage } from './pages/DoctorProfilePage'
import { DoctorAppointmentsPage } from './pages/DoctorAppointmentsPage'
import { DoctorPatientsPage } from './pages/DoctorPatientsPage'
import { AdminDoctorsPage } from './pages/AdminDoctorsPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AdminPatientsPage } from './pages/AdminPatientsPage'
import { AdminPaymentsPage } from './pages/AdminPaymentsPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { SystemStatusPage } from './pages/SystemStatusPage'
import { PatientProfilePage } from './pages/PatientProfilePage'
import { PatientPrescriptionsPage } from './pages/PatientPrescriptionsPage'
import { SymptomCheckerPage } from './pages/SymptomCheckerPage'
import { DoctorPrescriptionsPage } from './pages/DoctorPrescriptionsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'

function RequireRoles({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const ok = allow.some((r) => user.roles.includes(r))
  if (!ok) return <Navigate to="/app/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="notifications"
          element={
            <RequireRoles allow={['PATIENT', 'DOCTOR', 'ADMIN']}>
              <NotificationsPage />
            </RequireRoles>
          }
        />
        <Route
          path="patient/profile"
          element={
            <RequireRoles allow={['PATIENT']}>
              <PatientProfilePage />
            </RequireRoles>
          }
        />
        <Route
          path="patient/prescriptions"
          element={
            <RequireRoles allow={['PATIENT']}>
              <PatientPrescriptionsPage />
            </RequireRoles>
          }
        />
        <Route
          path="patient/symptoms"
          element={
            <RequireRoles allow={['PATIENT']}>
              <SymptomCheckerPage />
            </RequireRoles>
          }
        />
        <Route
          path="appointments"
          element={
            <RequireRoles allow={['PATIENT', 'ADMIN']}>
              <AppointmentsPage />
            </RequireRoles>
          }
        />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route
          path="doctor/profile"
          element={
            <RequireRoles allow={['DOCTOR']}>
              <DoctorProfilePage />
            </RequireRoles>
          }
        />
        <Route
          path="doctor/appointments"
          element={
            <RequireRoles allow={['DOCTOR']}>
              <DoctorAppointmentsPage />
            </RequireRoles>
          }
        />
        <Route
          path="doctor/patients"
          element={
            <RequireRoles allow={['DOCTOR']}>
              <DoctorPatientsPage />
            </RequireRoles>
          }
        />
        <Route
          path="doctor/prescriptions"
          element={
            <RequireRoles allow={['DOCTOR']}>
              <DoctorPrescriptionsPage />
            </RequireRoles>
          }
        />
        <Route
          path="admin/doctors"
          element={
            <RequireRoles allow={['ADMIN']}>
              <AdminDoctorsPage />
            </RequireRoles>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequireRoles allow={['ADMIN']}>
              <AdminUsersPage />
            </RequireRoles>
          }
        />
        <Route
          path="admin/patients"
          element={
            <RequireRoles allow={['ADMIN']}>
              <AdminPatientsPage />
            </RequireRoles>
          }
        />
        <Route
          path="admin/payments"
          element={
            <RequireRoles allow={['ADMIN']}>
              <AdminPaymentsPage />
            </RequireRoles>
          }
        />
        <Route
          path="payments"
          element={
            <RequireRoles allow={['PATIENT']}>
              <PaymentsPage />
            </RequireRoles>
          }
        />
        <Route
          path="status"
          element={
            <RequireRoles allow={['ADMIN']}>
              <SystemStatusPage />
            </RequireRoles>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
