import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label, Select } from '../ui/primitives'

type DoctorProfile = {
  id: number
  userId: number
  fullName: string
  phone?: string | null
  registrationNo: string
  specialization: string
  documentsUrl?: string | null
  profilePhotoUrl?: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  updatedAt: string
  rejectionReason?: string | null
}

type AvailabilityBlock = {
  id?: number
  doctorId?: number
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string
  endTime: string
}

const DAYS: AvailabilityBlock['dayOfWeek'][] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

function normalizeTime(t: string) {
  if (!t) return ''
  // API may return HH:mm:ss; <input type="time"> expects HH:mm
  return t.length >= 5 ? t.slice(0, 5) : t
}

function minutesOf(t: string) {
  const [hh, mm] = t.split(':')
  const h = Number.parseInt(hh ?? '', 10)
  const m = Number.parseInt(mm ?? '', 10)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN
  return h * 60 + m
}

export function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [registrationNo, setRegistrationNo] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [documentsUrl, setDocumentsUrl] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [availability, setAvailability] = useState<AvailabilityBlock[]>([])
  const [dayOfWeek, setDayOfWeek] = useState<AvailabilityBlock['dayOfWeek']>('MONDAY')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [availLoading, setAvailLoading] = useState(false)
  const [availSaving, setAvailSaving] = useState(false)
  const [availError, setAvailError] = useState<string | null>(null)
  const [availSuccess, setAvailSuccess] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const res = await api.get<DoctorProfile>('/doctors/me/profile')
      setProfile(res.data)
      setFullName(res.data.fullName)
      setPhone(res.data.phone ?? '')
      setRegistrationNo(res.data.registrationNo)
      setSpecialization(res.data.specialization)
      setDocumentsUrl(res.data.documentsUrl ?? '')
    } catch (err: any) {
      setProfile(null)
      // if not created yet, server likely returns 404
    }
  }

  async function loadAvailability() {
    setAvailError(null)
    setAvailSuccess(null)
    setAvailLoading(true)
    try {
      const res = await api.get<AvailabilityBlock[]>('/doctors/me/availability')
      setAvailability(
        (res.data ?? []).map((b) => ({
          ...b,
          startTime: normalizeTime(b.startTime),
          endTime: normalizeTime(b.endTime),
        })),
      )
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) {
        setAvailability([])
        return
      }
      setAvailError(formatApiError(err, 'Failed to load availability'))
    } finally {
      setAvailLoading(false)
    }
  }

  function addBlock() {
    setAvailError(null)
    setAvailSuccess(null)

    const s = normalizeTime(startTime)
    const e = normalizeTime(endTime)
    const sm = minutesOf(s)
    const em = minutesOf(e)
    if (!Number.isFinite(sm) || !Number.isFinite(em)) {
      setAvailError('Start/end time is invalid')
      return
    }
    if (sm >= em) {
      setAvailError('Start time must be before end time')
      return
    }

    const next: AvailabilityBlock = { dayOfWeek, startTime: s, endTime: e }
    const dayIndex = new Map(DAYS.map((d, i) => [d, i]))
    setAvailability((prev) =>
      [...prev, next].sort((a, b) => {
        const da = dayIndex.get(a.dayOfWeek) ?? 0
        const db = dayIndex.get(b.dayOfWeek) ?? 0
        if (da !== db) return da - db
        return minutesOf(a.startTime) - minutesOf(b.startTime)
      }),
    )
  }

  function removeBlock(idx: number) {
    setAvailError(null)
    setAvailSuccess(null)
    setAvailability((prev) => prev.filter((_, i) => i !== idx))
  }

  async function saveAvailability() {
    if (!profile) {
      setAvailError('Create your profile first')
      return
    }

    setAvailSaving(true)
    setAvailError(null)
    setAvailSuccess(null)
    try {
      const res = await api.put<AvailabilityBlock[]>('/doctors/me/availability', {
        blocks: availability.map((b) => ({
          dayOfWeek: b.dayOfWeek,
          startTime: normalizeTime(b.startTime),
          endTime: normalizeTime(b.endTime),
        })),
      })
      setAvailability(
        (res.data ?? []).map((b) => ({
          ...b,
          startTime: normalizeTime(b.startTime),
          endTime: normalizeTime(b.endTime),
        })),
      )
      setAvailSuccess('Availability saved')
    } catch (err: any) {
      setAvailError(formatApiError(err, 'Failed to save availability'))
    } finally {
      setAvailSaving(false)
    }
  }

  async function uploadPhoto() {
    setError(null)
    setSuccess(null)

    if (!profile) {
      setError('Create your profile first')
      return
    }
    if (!photoFile) {
      setError('Please choose an image')
      return
    }
    if (photoFile.size > 2 * 1024 * 1024) {
      setError('Photo must be 2MB or less')
      return
    }

    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', photoFile)
      const res = await api.post<DoctorProfile>('/doctors/me/profile-photo', fd)
      setProfile(res.data)
      setPhotoFile(null)
      setSuccess('Profile photo updated')
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to upload photo'))
    } finally {
      setPhotoUploading(false)
    }
  }

  async function save() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post<DoctorProfile>('/doctors/me/profile', {
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        registrationNo: registrationNo.trim(),
        specialization: specialization.trim(),
        documentsUrl: documentsUrl.trim() ? documentsUrl.trim() : null,
      })
      setProfile(res.data)
      setSuccess('Saved. Status is now ' + res.data.status)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to save profile'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    void loadAvailability()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-900">My doctor profile</div>
            <div className="text-xs text-slate-500">Manage your profile and submit for verification</div>
          </div>
          {profile && <Badge>{profile.status}</Badge>}
        </div>

        {profile?.rejectionReason && (
          <div className="mt-4">
            <Alert tone="warning">Rejected: {profile.rejectionReason}</Alert>
          </div>
        )}

        {profile && profile.status !== 'VERIFIED' && (
          <div className="mt-4">
            <Alert tone="info">
              Your profile is <span className="font-semibold">{profile.status}</span>. You will appear in the Doctors list only after an admin verifies you.
            </Alert>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
            {profile?.profilePhotoUrl ? (
              <img src={profile.profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No photo</div>
            )}
          </div>
          <div className="min-w-[240px] flex-1">
            <Label>Profile photo</Label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                disabled={loading || photoUploading || !profile}
              />
              <Button variant="secondary" onClick={uploadPhoto} disabled={loading || photoUploading || !profile || !photoFile}>
                {photoUploading ? 'Uploading…' : 'Upload'}
              </Button>
              <Badge>Max 2MB</Badge>
            </div>
            {!profile && <div className="mt-1 text-xs text-slate-500">Save your profile first to enable photo upload.</div>}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-white/60 p-2">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="border-0 bg-transparent" />
            </div>
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-white/60 p-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94..." className="border-0 bg-transparent" />
            </div>
          </div>
          <div>
            <Label>Registration no</Label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-white/60 p-2">
              <Input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} className="border-0 bg-transparent" />
            </div>
          </div>
          <div>
            <Label>Specialization</Label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-white/60 p-2">
              <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g., Dermatologist" className="border-0 bg-transparent" />
            </div>
          </div>
          <div>
            <Label>Documents URL (optional)</Label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-white/60 p-2">
              <Input value={documentsUrl} onChange={(e) => setDocumentsUrl(e.target.value)} placeholder="https://..." className="border-0 bg-transparent" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mt-4">
            <Alert tone="success">{success}</Alert>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={save} disabled={loading}>
            {loading ? 'Saving…' : 'Save profile'}
          </Button>
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-900">Availability</div>
            <div className="text-xs text-slate-500">Patients can only book within these weekly blocks (30-minute slots).</div>
          </div>
          <Button variant="secondary" onClick={loadAvailability} disabled={availLoading}>
            {availLoading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>

        {!profile && (
          <div className="mt-4">
            <Alert tone="info">Create your profile first to manage availability.</Alert>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <Label>Day</Label>
            <div className="mt-1">
              <Select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as AvailabilityBlock['dayOfWeek'])}
                disabled={availSaving || !profile}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Start</Label>
            <div className="mt-1">
              <Input type="time" step={1800} value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={availSaving || !profile} />
            </div>
          </div>
          <div>
            <Label>End</Label>
            <div className="mt-1">
              <Input type="time" step={1800} value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={availSaving || !profile} />
            </div>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={addBlock} disabled={availSaving || !profile}>
              Add block
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="hospital-table-head">
              <tr>
                <th className="px-3 py-2 font-semibold">Day</th>
                <th className="px-3 py-2 font-semibold">Start</th>
                <th className="px-3 py-2 font-semibold">End</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {availability.map((b, idx) => (
                <tr key={`${b.dayOfWeek}-${b.startTime}-${b.endTime}-${idx}`} className="hospital-table-row">
                  <td className="px-3 py-3 text-xs text-slate-700">{b.dayOfWeek}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{normalizeTime(b.startTime)}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{normalizeTime(b.endTime)}</td>
                  <td className="px-3 py-3">
                    <Button variant="danger" onClick={() => removeBlock(idx)} disabled={availSaving || !profile}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
              {availability.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    No availability blocks set.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {availError && (
          <div className="mt-4">
            <Alert tone="error">{availError}</Alert>
          </div>
        )}
        {availSuccess && (
          <div className="mt-4">
            <Alert tone="success">{availSuccess}</Alert>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveAvailability} disabled={availSaving || !profile}>
            {availSaving ? 'Saving…' : 'Save availability'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
