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
import { AdminDoctorsPage } from './pages/AdminDoctorsPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { SystemStatusPage } from './pages/SystemStatusPage'

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
          path="admin/doctors"
          element={
            <RequireRoles allow={['ADMIN']}>
              <AdminDoctorsPage />
            </RequireRoles>
          }
        />
        <Route
          path="payments"
          element={
            <RequireRoles allow={['PATIENT', 'ADMIN']}>
              <PaymentsPage />
            </RequireRoles>
          }
        />
        <Route path="status" element={<SystemStatusPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
