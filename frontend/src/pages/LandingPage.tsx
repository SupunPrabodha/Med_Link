import { Link } from 'react-router-dom'
import { Button, Card } from '../ui/primitives'

export function LandingPage() {
	return (
		<div className="min-h-screen bg-slate-50">
			<div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
				<div>
					<div className="text-sm font-semibold text-slate-900">MediLink LK</div>
					<div className="mt-1 text-xs text-slate-500">Book appointments with verified doctors and pay online.</div>
				</div>

				<Card>
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div>
							<div className="text-lg font-semibold text-slate-900">Welcome</div>
							<div className="mt-1 text-sm text-slate-600">Sign in or create an account to use the app workflows.</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Link to="/login">
								<Button>Sign in</Button>
							</Link>
							<Link to="/register">
								<Button variant="secondary">Create account</Button>
							</Link>
						</div>
					</div>
				</Card>

				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<div className="text-sm font-semibold text-slate-900">For patients</div>
						<div className="mt-2 text-sm text-slate-700">Browse verified doctors, create appointments, and pay securely.</div>
						<div className="mt-4">
							<Link to="/app">
								<Button variant="ghost">Go to app</Button>
							</Link>
						</div>
					</Card>
					<Card>
						<div className="text-sm font-semibold text-slate-900">For doctors & admins</div>
						<div className="mt-2 text-sm text-slate-700">Doctors can submit profiles for verification. Admins can verify registrations and oversee workflows.</div>
					</Card>
				</div>
			</div>
		</div>
	)
}
