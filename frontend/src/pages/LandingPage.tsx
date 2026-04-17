import { Link } from 'react-router-dom'
import { Calendar, MonitorPlay, Bot, CreditCard, ClipboardList, Bell, User, Stethoscope, Shield } from 'lucide-react'

const features = [
  {
    icon: <Calendar className="h-6 w-6 text-sky-600" />,
    title: 'Smart Appointment Booking',
    desc: 'Browse verified doctors, view real-time availability, and book appointments in minutes. Get instant doctor approval notifications.',
    color: 'from-sky-50 to-blue-50',
    border: 'rgba(14,165,233,0.2)',
  },
  {
    icon: <MonitorPlay className="h-6 w-6 text-teal-600" />,
    title: 'Video Consultations',
    desc: 'Attend secure telemedicine sessions from home. HD video calls powered by Jitsi Meet — no extra software needed.',
    color: 'from-teal-50 to-emerald-50',
    border: 'rgba(15,118,110,0.2)',
  },
  {
    icon: <Bot className="h-6 w-6 text-violet-600" />,
    title: 'AI Symptom Checker',
    desc: 'Describe your symptoms and receive AI-powered health suggestions with recommended specialist types. Available 24/7.',
    color: 'from-violet-50 to-purple-50',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    icon: <CreditCard className="h-6 w-6 text-amber-600" />,
    title: 'Secure Online Payments',
    desc: 'Pay consultation fees safely via PayHere or Stripe. Full payment history and admin oversight for every transaction.',
    color: 'from-amber-50 to-orange-50',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    icon: <ClipboardList className="h-6 w-6 text-rose-600" />,
    title: 'Digital Prescriptions',
    desc: 'Doctors issue digital prescriptions after consultations. Patients access their full prescription history anytime.',
    color: 'from-pink-50 to-rose-50',
    border: 'rgba(236,72,153,0.2)',
  },
  {
    icon: <Bell className="h-6 w-6 text-cyan-600" />,
    title: 'Real-time Notifications',
    desc: 'Get SMS and email alerts for appointment updates, payment confirmations, and prescription issuance instantly.',
    color: 'from-cyan-50 to-sky-50',
    border: 'rgba(6,182,212,0.2)',
  },
]

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Register as a Patient, Doctor, or Admin in under 60 seconds.' },
  { num: '02', title: 'Find Your Doctor', desc: 'Browse verified specialists by specialty and check real-time slot availability.' },
  { num: '03', title: 'Book & Pay', desc: 'Pick an available slot, get doctor approval, and pay securely online.' },
  { num: '04', title: 'Attend & Get Care', desc: 'Join your video consultation and receive your digital prescription.' },
]

const roles = [
  {
    icon: <User className="h-10 w-10 text-sky-500" />,
    role: 'Patient',
    cls: 'role-card-patient',
    items: [
      'Register & manage your profile',
      'Upload medical reports',
      'Book & track appointments',
      'Attend video consultations',
      'View prescriptions & history',
      'AI-powered symptom checker',
    ],
  },
  {
    icon: <Stethoscope className="h-10 w-10 text-teal-500" />,
    role: 'Doctor',
    cls: 'role-card-doctor',
    items: [
      'Create a verified doctor profile',
      'Set weekly availability schedules',
      'Accept or reject appointments',
      'Conduct telemedicine sessions',
      'Issue digital prescriptions',
      'View patient medical reports',
    ],
  },
  {
    icon: <Shield className="h-10 w-10 text-violet-500" />,
    role: 'Admin',
    cls: 'role-card-admin',
    items: [
      'Verify doctor registrations',
      'Manage all user accounts',
      'Oversee all appointments',
      'Review payment transactions',
      'Monitor platform health',
      'Handle financial disputes',
    ],
  },
]

const stats = [
  { value: '10+', label: 'Microservices' },
  { value: '3', label: 'User Roles' },
  { value: '24/7', label: 'AI Symptom Check' },
  { value: '100%', label: 'Secure Payments' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f0f6ff' }}>

      {/* ─── Top Nav ────────────────────────────────────────────── */}
      <header className="hospital-topbar sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
              </svg>
            </div>
            <span className="text-base font-bold text-slate-900">MediLink <span className="text-sky-600">LK</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow: '0 4px 14px rgba(14,165,233,0.4)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="hero-section px-6 py-24 md:py-32">
        {/* decorative blobs */}
        <div className="hero-blob h-72 w-72 bg-sky-400" style={{ top: '-80px', left: '-60px' }} />
        <div className="hero-blob h-96 w-96 bg-teal-400" style={{ bottom: '-100px', right: '-80px', animationDelay: '3s' }} />
        <div className="hero-blob h-48 w-48 bg-indigo-400" style={{ top: '30%', right: '20%', animationDelay: '1.5s' }} />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <span className="hero-badge">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              AI-Enabled Smart Healthcare Platform
            </span>
          </div>

          <h1 className="hero-title mb-6">
            Healthcare Made<br />
            <span style={{ background: 'linear-gradient(90deg,#38bdf8,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Smarter &amp; Simpler
            </span>
          </h1>

          <p className="hero-subtitle mx-auto mb-10 max-w-2xl">
            Book appointments with verified doctors, attend HD video consultations, receive AI-powered
            health insights, and manage your complete medical history — all in one secure platform.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="hero-cta-primary">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/></svg>
              Book Your First Appointment
            </Link>
            <Link to="/login" className="hero-cta-secondary">
              Sign in to your account →
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat-card">
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="mt-1 text-xs text-sky-200/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in-up">
            <div className="mb-3 inline-block rounded-full bg-sky-100 px-4 py-1.5 text-xs font-semibold text-sky-700">
              Platform Features
            </div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Everything you need for{' '}
              <span className="gradient-text">better healthcare</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              A fully integrated microservices platform built for Sri Lanka's healthcare needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="feature-card"
                style={{ animationDelay: `${i * 0.08}s`, borderColor: f.border }}
              >
                <div
                  className="feature-icon mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(135deg,${f.color.replace('from-','').replace(' to-',',')})` }}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────── */}
      <section className="section-alt px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-block rounded-full bg-teal-100 px-4 py-1.5 text-xs font-semibold text-teal-700">
              How It Works
            </div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              From registration to recovery,{' '}
              <span className="gradient-text">in 4 steps</span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.num} className="step-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-start gap-3">
                  <div className="step-number shrink-0">{s.num}</div>
                  <div>
                    <div className="mb-2 font-semibold text-slate-900">{s.title}</div>
                    <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-block rounded-full bg-violet-100 px-4 py-1.5 text-xs font-semibold text-violet-700">
              Built for Everyone
            </div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Three roles, one{' '}
              <span className="gradient-text">unified platform</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((r, i) => (
              <div key={r.role} className={`role-card ${r.cls}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="mb-6 flex justify-center">{r.icon}</div>
                <h3 className="mb-4 text-center text-xl font-bold text-slate-900">{r.role}</h3>
                <ul className="space-y-2">
                  {r.items.map((item) => (
                     <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                       <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-teal-500">
                         <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                       </svg>
                       {item}
                     </li>
                   ))}
                </ul>
                <div className="mt-8 text-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-800"
                  >
                    Get started as {r.role} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div
          className="mx-auto max-w-4xl rounded-3xl p-12 text-center"
          style={{
            background: 'linear-gradient(135deg,#0c1a2e 0%,#0f3460 100%)',
            boxShadow: '0 20px 60px rgba(14,165,233,0.2)',
          }}
        >
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            Ready to transform your healthcare experience?
          </h2>
          <p className="mb-8 text-sky-200/80">
            Join patients, doctors, and admins on MediLink LK — Sri Lanka's AI-enabled telemedicine platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="hero-cta-primary">
              Create Free Account
            </Link>
            <Link to="/login" className="hero-cta-secondary">
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-sky-100 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-600 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-4H7v-2h4V6h2v4h4v2h-4z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-800">MediLink LK</span>
          </div>
          <p className="text-xs text-slate-400">
            SE3020 Distributed Systems • BSc (Hons) IT Software Engineering • Year 3 – 2026
          </p>
          <div className="flex gap-4 text-xs text-slate-400">
            <span>Microservices</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 self-center" />
            <span>Docker &amp; Kubernetes</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 self-center" />
            <span>React + Spring Boot</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
