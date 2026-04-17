import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'

type DoctorProfile = {
  id: number
  userId: number
  fullName: string
  registrationNo: string
  specialization: string
  bio?: string | null
  fee?: number | null
  documentsUrl?: string | null
  profilePhotoUrl?: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  updatedAt: string
  rejectionReason?: string | null
}

const SPECIALTIES = [
  'Cardiologist', 'Dermatologist', 'ENT Specialist', 'General Physician',
  'Gynecologist', 'Neurologist', 'Ophthalmologist', 'Orthopedic Surgeon',
  'Pediatrician', 'Psychiatrist', 'Radiologist', 'Urologist',
]

function DoctorCard({ doctor, onBook }: { doctor: DoctorProfile; onBook: (id: number) => void }) {
  const initials = doctor.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="doctor-card">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-sky-100">
            {doctor.profilePhotoUrl ? (
              <img
                src={doctor.profilePhotoUrl}
                alt={doctor.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-base font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0f766e)' }}
              >
                {initials}
              </div>
            )}
          </div>
          {doctor.status === 'VERIFIED' && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white shadow">
              ✓
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{doctor.fullName}</h3>
              <p className="mt-0.5 text-sm text-sky-600 font-medium">{doctor.specialization}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={
                doctor.status === 'VERIFIED'
                  ? { background: '#dcfce7', color: '#15803d' }
                  : { background: '#fef3c7', color: '#92400e' }
              }
            >
              {doctor.status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-slate-400">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clipRule="evenodd"/>
              </svg>
              Reg: {doctor.registrationNo}
            </span>
            {doctor.fee != null && (
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                💰 LKR {doctor.fee.toLocaleString()}
              </span>
            )}
          </div>

          {doctor.bio && (
            <p className="mt-2 text-xs text-slate-500 line-clamp-2">{doctor.bio}</p>
          )}
        </div>
      </div>

      {/* Action row */}
      {doctor.status === 'VERIFIED' && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">Available for appointments</span>
          <button
            onClick={() => onBook(doctor.id)}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow: '0 2px 8px rgba(14,165,233,0.3)' }}
          >
            Book Appointment →
          </button>
        </div>
      )}
    </div>
  )
}

export function DoctorsPage() {
  const nav = useNavigate()
  const [specialization, setSpecialization] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [rows, setRows] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<DoctorProfile[]>('/doctors', {
        params: specialization.trim() ? { specialization: specialization.trim() } : undefined,
      })
      setRows(res.data ?? [])
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load doctors'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = rows.filter((d) =>
    !nameFilter.trim() || d.fullName.toLowerCase().includes(nameFilter.trim().toLowerCase())
  )

  return (
    <div className="space-y-6">

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg,#0c1a2e,#0f3460)', boxShadow: '0 8px 32px rgba(14,165,233,0.18)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Browse Doctors</h1>
            <p className="mt-1 text-sm text-sky-200/70">
              {rows.length} verified specialist{rows.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="text-xs text-sky-300">Real-time availability</span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-3">
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="flex-1 min-w-[180px] rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/50 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
          >
            <option value="" className="text-slate-900 bg-white">All Specializations</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s} className="text-slate-900 bg-white">{s}</option>
            ))}
          </select>

          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search by name…"
            className="flex-1 min-w-[160px] rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
          />

          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
          >
            {loading ? 'Searching…' : '🔍 Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ─── Info Banner ────────────────────────────────────────── */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 px-5 py-3 text-sm text-sky-700">
        <span className="font-semibold">ℹ️ Note:</span> Only <strong>VERIFIED</strong> doctors are shown here. New doctor registrations must be approved by an Admin before appearing.
      </div>

      {/* ─── Doctor Cards Grid ───────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mx-auto mb-3 text-4xl">🩺</div>
          <p className="font-medium text-slate-600">No doctors found</p>
          <p className="mt-1 text-sm text-slate-400">Try a different specialization or clear the name filter</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((d) => (
            <DoctorCard
              key={d.id}
              doctor={d}
              onBook={() => nav('/app/appointments')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
