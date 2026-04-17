import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { Badge, Button, cn } from '../ui/primitives'

type NavItem = {
	label: string
	to: string
	show?: (roles: string[]) => boolean
}

const items: NavItem[] = [
	{ label: 'Dashboard', to: '/app/dashboard' },
	{ label: 'Notifications', to: '/app/notifications', show: (roles) => roles.length > 0 },
	{ label: 'My Profile', to: '/app/patient/profile', show: (roles) => roles.includes('PATIENT') },
	{ label: 'Doctors', to: '/app/doctors' },
	{ label: 'Appointments', to: '/app/appointments', show: (roles) => roles.includes('PATIENT') || roles.includes('ADMIN') },
	{ label: 'Payments', to: '/app/payments', show: (roles) => roles.includes('PATIENT') },
	{ label: 'Doctor Profile', to: '/app/doctor/profile', show: (roles) => roles.includes('DOCTOR') },
	{ label: 'Appointments', to: '/app/doctor/appointments', show: (roles) => roles.includes('DOCTOR') },
	{ label: 'Patients', to: '/app/doctor/patients', show: (roles) => roles.includes('DOCTOR') },
	{ label: 'Doctor Verification', to: '/app/admin/doctors', show: (roles) => roles.includes('ADMIN') },
	{ label: 'Patients', to: '/app/admin/patients', show: (roles) => roles.includes('ADMIN') },
	{ label: 'Payments', to: '/app/admin/payments', show: (roles) => roles.includes('ADMIN') },
	{ label: 'User Management', to: '/app/admin/users', show: (roles) => roles.includes('ADMIN') },
	{ label: 'Platform Status', to: '/app/status', show: (roles) => roles.includes('ADMIN') },
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
		<div className="hospital-shell">
			<div className="hospital-topbar">
				<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
					<div className="flex items-center gap-3">
						<Link to="/" className="text-sm font-semibold tracking-wide text-slate-900">
							MediLink LK
						</Link>
						{user && (
							<div className="flex flex-wrap items-center gap-2">
								<Badge className="font-mono">{user.email}</Badge>
								{hasRole(user, 'ADMIN') && <Badge>ADMIN</Badge>}
								{hasRole(user, 'DOCTOR') && <Badge>DOCTOR</Badge>}
								{hasRole(user, 'PATIENT') && <Badge>PATIENT</Badge>}
							</div>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button variant="secondary" onClick={onLogout}>
							Logout
						</Button>
					</div>
				</div>
			</div>

			<div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
				<aside className="hospital-panel rounded-xl p-3 md:sticky md:top-6 md:self-start">
					<div className="space-y-1">
						{items
							.filter((i) => (i.show ? i.show(roles) : true))
							.map((i) => {
								const active = loc.pathname === i.to
								return (
									<Link
										key={i.to}
										to={i.to}
										aria-current={active ? 'page' : undefined}
										className={cn(
											'hospital-nav-link',
											active ? 'hospital-nav-link-active' : 'hospital-nav-link-inactive',
										)}
									>
										{i.label}
									</Link>
								)
							})}
					</div>
				</aside>

				<main className="min-w-0">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
