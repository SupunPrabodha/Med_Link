import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasRole, useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { X } from 'lucide-react'
import { useToast } from '../ui/toast'

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

function DoctorCard({ doctor, onBook, onClick }: { doctor: DoctorProfile; onBook: (id: number) => void; onClick: () => void }) {
  const initials = doctor.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div 
      className="doctor-card cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-sky-100 shadow-sm">
            {doctor.profilePhotoUrl ? (
              <img
                src={doctor.profilePhotoUrl}
                alt={doctor.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-base font-bold text-white shadow-inner"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0f766e)' }}
              >
                {initials}
              </div>
            )}
          </div>
          {doctor.status === 'VERIFIED' && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white shadow ring-2 ring-white">
              ✓
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{doctor.fullName}</h3>
              <p className="mt-0.5 text-sm text-sky-600 font-medium">{doctor.specialization}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
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
            <span className="flex items-center gap-1 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
              Reg: {doctor.registrationNo}
            </span>
            {doctor.fee != null && (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                LKR {doctor.fee.toLocaleString()}
              </span>
            )}
          </div>

          {doctor.bio && (
            <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">{doctor.bio}</p>
          )}
        </div>
      </div>

      {/* Action row */}
      {doctor.status === 'VERIFIED' && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Available for appointments
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook(doctor.id);
            }}
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

function DoctorModal({
  doctor,
  onClose,
  onBook,
  adminActions,
}: {
  doctor: DoctorProfile
  onClose: () => void
  onBook: (id: number) => void
  adminActions?: ReactNode
}) {
  const initials = doctor.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Close when clicking outside
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        {/* Cover Header */}
        <div className="relative h-32 bg-gradient-to-r from-sky-500 to-teal-500 flex-shrink-0">
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors backdrop-blur-md"
           >
             <X className="h-5 w-5" />
           </button>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-6 pt-0 relative flex-1 overflow-y-auto">
           {/* Avatar Overlapping Header */}
           <div className="flex justify-between items-end">
             <div className="-mt-12 mb-4 h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg shrink-0">
               {doctor.profilePhotoUrl ? (
                 <img src={doctor.profilePhotoUrl} alt={doctor.fullName} className="h-full w-full object-cover" />
               ) : (
                 <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white shadow-inner" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0f766e)' }}>
                   {initials}
                 </div>
               )}
             </div>
             
             {/* Verification Badge */}
             <div className="mb-4">
               {doctor.status === 'VERIFIED' && (
                 <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm border border-emerald-200">
                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                   Verified Doctor
                 </span>
               )}
             </div>
           </div>

           {/* Details */}
           <div>
             <h2 className="text-2xl font-extrabold text-slate-900">{doctor.fullName}</h2>
             <p className="mt-1 text-base font-semibold text-sky-600">{doctor.specialization}</p>
             
             <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-400 mb-1">Registration #</span>
                  <span className="font-mono text-sm text-slate-700">{doctor.registrationNo}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-400 mb-1">Consultation Fee</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {doctor.fee != null ? `LKR ${doctor.fee.toLocaleString()}` : 'Not Set'}
                  </span>
                </div>
             </div>

             <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-100 pb-2">About Doctor</h3>
                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {doctor.bio ? doctor.bio : "This doctor hasn't added a bio yet."}
                </p>
             </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>{adminActions}</div>
          <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          {doctor.status === 'VERIFIED' && (
            <button
              onClick={() => {
                onClose();
                onBook(doctor.id);
              }}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}
            >
              Book Appointment Now
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoctorsPage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const isAdmin = hasRole(user, 'ADMIN')
  const toast = useToast()

  const [specialization, setSpecialization] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [rows, setRows] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null)

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

  async function deleteDoctor(d: DoctorProfile) {
    if (!isAdmin) return
    const ok = window.confirm(`Delete doctor ${d.fullName} (Doctor ID ${d.id})?`)
    if (!ok) return

    setDeleting(true)
    setError(null)
    try {
      // Remove doctor profile (doctor-service)
      await api.delete(`/admin/doctors/${d.id}`)

      // Remove auth account (auth-service). Best-effort: if this fails,
      // doctor profile is still removed so they won't appear in the list.
      try {
        await api.delete(`/admin/users/${d.userId}`)
      } catch (e: any) {
        toast.warning(formatApiError(e, 'Doctor profile deleted, but user account removal failed'))
      }

      toast.success('Doctor removed')
      setSelectedDoctor(null)
      await load()
    } catch (err: any) {
      toast.error(formatApiError(err, 'Failed to delete doctor'))
    } finally {
      setDeleting(false)
    }
  }

  const filtered = rows.filter((d) =>
    !nameFilter.trim() || d.fullName.toLowerCase().includes(nameFilter.trim().toLowerCase())
  )

  return (
    <div className="space-y-6">

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0c1a2e,#0f3460)', boxShadow: '0 8px 32px rgba(14,165,233,0.18)' }}
      >
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Browse Doctors</h1>
            <p className="mt-1 text-sm text-sky-200/80">
              {rows.filter(d => d.status === 'VERIFIED').length} verified specialist{rows.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 border border-white/10 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-sky-100">Platform Active</span>
          </div>
        </div>

        {/* Filters */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-3">
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="flex-1 min-w-[200px] rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/50 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition-shadow appearance-none"
            style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '10px auto' }}
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
            className="flex-1 min-w-[200px] rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition-shadow"
          />

          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-60 shadow-lg hover:shadow-sky-500/20"
          >
            {loading ? 'Searching…' : 'Search Doctors'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ─── Doctor Cards Grid ───────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-[200px] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
          </div>
          <p className="text-lg font-bold text-slate-700">No doctors found</p>
          <p className="mt-1 text-sm text-slate-500">Try a different specialization or clear the name filter.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DoctorCard
              key={d.id}
              doctor={d}
              onBook={(id) => nav(`/app/appointments?doctorId=${id}`)}
              onClick={() => setSelectedDoctor(d)}
            />
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedDoctor && (
        <DoctorModal 
          doctor={selectedDoctor} 
          onClose={() => setSelectedDoctor(null)} 
          onBook={(id) => nav(`/app/appointments?doctorId=${id}`)} 
          adminActions={
            isAdmin ? (
              <button
                onClick={() => void deleteDoctor(selectedDoctor)}
                disabled={deleting}
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete Doctor'}
              </button>
            ) : null
          }
        />
      )}
    </div>
  )
}
