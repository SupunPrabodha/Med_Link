import { Link } from 'react-router-dom'
import { Button, Card } from '../ui/primitives'

export function LandingPage() {
	return (
		<div className="relative min-h-screen bg-slate-50">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(700px_circle_at_85%_0%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(700px_circle_at_50%_110%,rgba(15,23,42,0.05),transparent_55%),linear-gradient(to_bottom,rgba(248,250,252,1),rgba(236,253,245,0.70),rgba(248,250,252,1))]" />

			<div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
				<header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
					<div className="flex items-center gap-3">
						<div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-600/25">
							ML
						</div>
						<div>
							<div className="text-sm font-semibold tracking-tight text-slate-900">MediLink LK</div>
							<div className="mt-0.5 text-xs text-slate-600">Book appointments with verified doctors and pay online.</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-end gap-2">
						<Link to="/login">
							<Button className="bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-700 focus-visible:ring-emerald-400">
								Sign in
							</Button>
						</Link>
						<Link to="/register">
							<Button
								variant="secondary"
								className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 focus-visible:ring-emerald-200"
							>
								Create account
							</Button>
						</Link>
					</div>
				</header>

				<main className="mt-8 grid gap-6 rounded-3xl border border-slate-200/70 bg-white/55 p-6 shadow-sm backdrop-blur lg:grid-cols-12 lg:gap-8">
					<section className="lg:col-span-7">
						<div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
							Trusted, verified healthcare bookings
						</div>

						<h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
							Book appointments with verified doctors.
							<span className="block text-emerald-700">Pay online. Get care faster.</span>
						</h1>
						<p className="mt-4 max-w-xl text-sm leading-6 text-slate-700 sm:text-base">
							Find the right specialist, schedule in minutes, and manage everything in one place—securely.
						</p>

						<div className="mt-6 flex flex-wrap gap-3">
							<Link to="/register">
								<Button className="bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-700 focus-visible:ring-emerald-400">
									Get started
								</Button>
							</Link>
							<Link to="/app">
								<Button
									variant="secondary"
									className="border-emerald-200 bg-white/80 text-slate-900 hover:bg-emerald-50 active:bg-emerald-50 focus-visible:ring-emerald-200"
								>
									Go to app
								</Button>
							</Link>
						</div>

						<div className="mt-7 grid gap-3 sm:grid-cols-2">
							<div className="flex items-start gap-3 rounded-xl border border-emerald-100/70 bg-emerald-50/40 p-4 shadow-sm">
								<div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
									<span className="text-sm font-semibold">✓</span>
								</div>
								<div>
									<div className="text-sm font-semibold text-slate-900">Verified doctors</div>
									<div className="mt-1 text-xs text-slate-600">Profiles reviewed to keep patients safe.</div>
								</div>
							</div>
							<div className="flex items-start gap-3 rounded-xl border border-emerald-100/70 bg-emerald-50/40 p-4 shadow-sm">
								<div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-white/70 text-emerald-700 ring-1 ring-emerald-200/70">
									<span className="text-sm font-semibold">₨</span>
								</div>
								<div>
									<div className="text-sm font-semibold text-slate-900">Secure payments</div>
									<div className="mt-1 text-xs text-slate-600">Pay online with clear receipts.</div>
								</div>
							</div>
						</div>
					</section>

					<aside className="lg:col-span-5">
						<Card className="border-emerald-100/70 bg-white/70 shadow-sm ring-1 ring-slate-900/5 backdrop-blur">
							<div className="text-sm font-semibold text-slate-900">Welcome</div>
							<div className="mt-1 text-sm text-slate-700">Sign in or create an account to use the app workflows.</div>
							<div className="mt-5 grid gap-2 sm:grid-cols-2">
								<Link to="/login" className="block">
									<Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-700 focus-visible:ring-emerald-400">
										Sign in
									</Button>
								</Link>
								<Link to="/register" className="block">
									<Button
										variant="secondary"
										className="w-full border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 focus-visible:ring-emerald-200"
									>
										Create account
									</Button>
								</Link>
							</div>
							<div className="mt-6 rounded-xl border border-emerald-100/70 bg-emerald-50/40 p-4">
								<div className="text-xs font-semibold text-slate-900">Quick start</div>
								<ul className="mt-2 space-y-2 text-xs text-slate-600">
									<li className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />Create your account</li>
									<li className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />Browse doctors</li>
									<li className="flex gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />Book & pay online</li>
								</ul>
							</div>
						</Card>
					</aside>
				</main>

				<section className="mt-8 grid gap-4 md:grid-cols-2">
					<Card className="border-emerald-100/70 bg-white/70 shadow-sm ring-1 ring-slate-900/5 backdrop-blur">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-sm font-semibold text-slate-900">For patients</div>
								<div className="mt-2 text-sm text-slate-700">
									Browse verified doctors, create appointments, and pay securely.
								</div>
							</div>
							<span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
								Patients
							</span>
						</div>
						<div className="mt-5">
							<Link to="/app">
								<Button
									variant="ghost"
									className="text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 focus-visible:ring-emerald-200"
								>
									Go to app
								</Button>
							</Link>
						</div>
					</Card>

					<Card className="border-emerald-100/70 bg-white/70 shadow-sm ring-1 ring-slate-900/5 backdrop-blur">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-sm font-semibold text-slate-900">For doctors & admins</div>
								<div className="mt-2 text-sm text-slate-700">
									Doctors can submit profiles for verification. Admins can verify registrations and oversee workflows.
								</div>
							</div>
							<span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
								Staff
							</span>
						</div>
					</Card>
				</section>
			</div>
		</div>
	)
}
