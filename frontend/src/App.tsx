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
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctor/profile" element={<DoctorProfilePage />} />
        <Route path="admin/doctors" element={<AdminDoctorsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="status" element={<SystemStatusPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
