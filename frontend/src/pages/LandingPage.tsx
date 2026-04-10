import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../ui/primitives'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">MediLink LK</div>
            <div className="text-xs text-slate-500">AI-enabled telemedicine platform (distributed systems skeleton)</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Create account</Button>
            </Link>
          </div>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="p-7">
            <div className="flex items-center gap-2">
              <Badge>Gateway</Badge>
              <Badge>Eureka</Badge>
              <Badge>JWT + RBAC</Badge>
              <Badge>RabbitMQ</Badge>
              <Badge>Postgres</Badge>
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">A professional UI for the MediLink microservices system</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This UI is intentionally focused on the marking workflows: authentication, doctor onboarding + admin verification,
              appointment booking, payment intent creation, and status monitoring.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/login">
                <Button>Open app</Button>
              </Link>
              <a href="http://localhost:8090/swagger" target="_blank" rel="noreferrer">
                <Button variant="secondary">Gateway Swagger</Button>
              </a>
              <a href="http://localhost:8761" target="_blank" rel="noreferrer">
                <Button variant="secondary">Eureka</Button>
              </a>
            </div>
          </Card>

          <Card className="p-7">
            <h2 className="text-lg font-semibold text-slate-900">Quick start (Docker)</h2>
            <p className="mt-2 text-sm text-slate-600">Run the full stack, then sign in here.</p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              <div className="font-mono">docker compose up -d --build</div>
              <div className="mt-2">Gateway: <span className="font-mono">http://localhost:8090</span></div>
              <div>UI (dev): <span className="font-mono">http://localhost:5173</span></div>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-900">Roles supported</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>PATIENT</Badge>
                  <Badge>DOCTOR</Badge>
                  <Badge>ADMIN</Badge>
                </div>
                <div className="mt-2 text-xs text-slate-600">Register any role from the UI to test RBAC.</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-900">API base URL</div>
                <div className="mt-2 text-xs text-slate-600">
                  UI calls the gateway via <span className="font-mono">VITE_API_BASE_URL</span> (default: <span className="font-mono">http://localhost:8090</span>).
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
