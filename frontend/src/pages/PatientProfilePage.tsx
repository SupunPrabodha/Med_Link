import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label, Select } from '../ui/primitives'

type PatientProfile = {
  id: number
  userId: number
  fullName: string
  phone: string
  dateOfBirth: string | null
  address: string | null
  gender?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  profilePhotoUrl?: string | null
  updatedAt: string
}

type MedicalReport = {
  id: number
  fileName: string
  contentType: string
  sizeBytes: number
  description: string | null
  uploadedAt: string
}

type Appointment = {
  id: number
  patientId: number
  doctorId: number
  slotTime: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
  appoinmentApproval?: 'APPROVED' | 'DECLINED' | null
}

type Prescription = {
  id: number
  doctorUserId: number
  patientUserId: number
  appointmentId?: number | null
  diagnosis?: string | null
  medications: string
  notes?: string | null
  issuedAt: string
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, idx)
  const rounded = value >= 10 || idx === 0 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded} ${units[idx]}`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [gender, setGender] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const [reports, setReports] = useState<MedicalReport[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [reportDescription, setReportDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const profileChanged = useMemo(() => {
    if (!profile)
      return (
        fullName.trim() ||
        phone.trim() ||
        dateOfBirth.trim() ||
        address.trim() ||
        gender.trim() ||
        emergencyContactName.trim() ||
        emergencyContactPhone.trim()
      )
    return (
      fullName !== profile.fullName ||
      phone !== profile.phone ||
      (dateOfBirth || '') !== (profile.dateOfBirth ?? '') ||
      (address || '') !== (profile.address ?? '') ||
      (gender || '') !== (profile.gender ?? '') ||
      (emergencyContactName || '') !== (profile.emergencyContactName ?? '') ||
      (emergencyContactPhone || '') !== (profile.emergencyContactPhone ?? '')
    )
  }, [address, dateOfBirth, emergencyContactName, emergencyContactPhone, fullName, gender, phone, profile])

  async function loadAll() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [profileRes, reportsRes, apptsRes, prescRes] = await Promise.allSettled([
        api.get<PatientProfile>('/patients/me/profile'),
        api.get<MedicalReport[]>('/patients/me/reports'),
        api.get<Appointment[]>('/appointments'),
        api.get<Prescription[]>('/prescriptions/patient/me'),
      ])

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data)
        setFullName(profileRes.value.data.fullName)
        setPhone(profileRes.value.data.phone)
        setDateOfBirth(profileRes.value.data.dateOfBirth ?? '')
        setAddress(profileRes.value.data.address ?? '')
        setGender(profileRes.value.data.gender ?? '')
        setEmergencyContactName(profileRes.value.data.emergencyContactName ?? '')
        setEmergencyContactPhone(profileRes.value.data.emergencyContactPhone ?? '')
      } else {
        const status = (profileRes.reason as any)?.response?.status
        if (status === 404) {
          setProfile(null)
        } else {
          setError(formatApiError(profileRes.reason, 'Failed to load your profile'))
        }
      }

      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data ?? [])
      else setError((prev) => prev ?? formatApiError(reportsRes.reason, 'Failed to load your reports'))

      if (apptsRes.status === 'fulfilled') setAppointments(apptsRes.value.data ?? [])
      else setError((prev) => prev ?? formatApiError(apptsRes.reason, 'Failed to load your appointments'))

      if (prescRes.status === 'fulfilled') setPrescriptions(prescRes.value.data ?? [])
      else setError((prev) => prev ?? formatApiError(prescRes.reason, 'Failed to load your prescriptions'))
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load your data'))
    } finally {
      setLoading(false)
    }
  }

  const timeline = useMemo(() => {
    const items: Array<
      | { kind: 'REPORT'; at: string; report: MedicalReport }
      | { kind: 'APPOINTMENT'; at: string; appt: Appointment }
      | { kind: 'PRESCRIPTION'; at: string; presc: Prescription }
    > = []

    for (const r of reports) items.push({ kind: 'REPORT', at: r.uploadedAt, report: r })
    for (const a of appointments) items.push({ kind: 'APPOINTMENT', at: a.slotTime, appt: a })
    for (const p of prescriptions) items.push({ kind: 'PRESCRIPTION', at: p.issuedAt, presc: p })

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    return items
  }, [appointments, prescriptions, reports])

  async function saveProfile() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth.trim() ? dateOfBirth.trim() : null,
        address: address.trim() ? address.trim() : null,
        gender: gender.trim() ? gender.trim() : null,
        emergencyContactName: emergencyContactName.trim() ? emergencyContactName.trim() : null,
        emergencyContactPhone: emergencyContactPhone.trim() ? emergencyContactPhone.trim() : null,
      }
      const res = await api.post<PatientProfile>('/patients/me/profile', payload)
      setProfile(res.data)
      setSuccess('Profile saved')
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to save profile'))
    } finally {
      setLoading(false)
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
      const res = await api.post<PatientProfile>('/patients/me/profile-photo', fd)
      setProfile(res.data)
      setPhotoFile(null)
      setSuccess('Profile photo updated')
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to upload photo'))
    } finally {
      setPhotoUploading(false)
    }
  }

  async function uploadReport() {
    setError(null)
    setSuccess(null)
    if (!reportFile) {
      setError('Please choose a file to upload')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', reportFile)
      if (reportDescription.trim()) fd.append('description', reportDescription.trim())

      await api.post('/patients/me/reports', fd)
      setReportFile(null)
      setReportDescription('')

      await loadAll()
      setSuccess('Report uploaded')
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to upload report'))
    } finally {
      setLoading(false)
    }
  }

  async function downloadReport(r: MedicalReport) {
    setError(null)
    try {
      const res = await api.get(`/patients/me/reports/${r.id}/download`, { responseType: 'blob' })
      downloadBlob(res.data, r.fileName)
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to download report'))
    }
  }

  async function deleteReport(id: number) {
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await api.delete(`/patients/me/reports/${id}`)
      setReports((prev) => prev.filter((r) => r.id !== id))
      setSuccess('Report removed')
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to remove report'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">My profile</div>
            <div className="text-xs text-slate-500">Manage your patient details and medical reports</div>
          </div>
          <div className="flex items-center gap-2">
            {profile && <Badge className="font-mono">Account #{profile.userId}</Badge>}
            <Button variant="secondary" onClick={loadAll} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
        </div>

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
            <div className="mt-1">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
          </div>
          <div>
            <Label>Phone</Label>
            <div className="mt-1">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07x xxxx xxx" />
            </div>
          </div>
          <div>
            <Label>Gender (optional)</Label>
            <div className="mt-1">
              <Select value={gender} onChange={(e) => setGender(e.target.value)} disabled={loading}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Date of birth (optional)</Label>
            <div className="mt-1">
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Address (optional)</Label>
            <div className="mt-1">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City / address" />
            </div>
          </div>
          <div>
            <Label>Emergency contact name (optional)</Label>
            <div className="mt-1">
              <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="Name" />
            </div>
          </div>
          <div>
            <Label>Emergency contact phone (optional)</Label>
            <div className="mt-1">
              <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="07x xxxx xxx" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveProfile} disabled={loading || !profileChanged || !fullName.trim() || !phone.trim()}>
            {loading ? 'Saving…' : 'Save profile'}
          </Button>
          {profile?.updatedAt && <Badge>Updated {new Date(profile.updatedAt).toLocaleString()}</Badge>}
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
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Medical reports</div>
            <div className="text-xs text-slate-500">Upload lab reports and documents for your doctor</div>
          </div>
          <Badge>Max 5MB per file</Badge>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label>File</Label>
            <div className="mt-1">
              <Input
                type="file"
                onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                disabled={loading}
                accept=".pdf,.png,.jpg,.jpeg,.txt"
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">Recommended formats: PDF, JPG/PNG.</div>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <div className="mt-1">
              <Input value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="e.g., Blood test" disabled={loading} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={uploadReport} disabled={loading || !reportFile}>
            {loading ? 'Uploading…' : 'Upload report'}
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">File</th>
                <th className="px-3 py-2 font-semibold">Uploaded</th>
                <th className="px-3 py-2 font-semibold">Size</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-medium text-slate-900">{r.fileName}</td>
                  <td className="px-3 py-3 text-slate-700">{new Date(r.uploadedAt).toLocaleString()}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{formatBytes(r.sizeBytes)}</td>
                  <td className="px-3 py-3 text-slate-700">{r.description ?? '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => downloadReport(r)}>
                        Download
                      </Button>
                      <Button variant="danger" onClick={() => deleteReport(r.id)} disabled={loading}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No reports uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Medical history timeline</div>
            <div className="text-xs text-slate-500">Appointments, reports, and prescriptions in one place</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{appointments.length} appointments</Badge>
            <Badge>{reports.length} reports</Badge>
            <Badge>{prescriptions.length} prescriptions</Badge>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Details</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {timeline.map((t) => {
                if (t.kind === 'REPORT') {
                  const r = t.report
                  return (
                    <tr key={`report-${r.id}`} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <Badge>REPORT</Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{new Date(r.uploadedAt).toLocaleString()}</td>
                      <td className="px-3 py-3 text-slate-700">
                        <div className="font-medium text-slate-900">{r.fileName}</div>
                        <div className="text-xs text-slate-600">{r.description ?? '—'} • {formatBytes(r.sizeBytes)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <Button variant="secondary" onClick={() => downloadReport(r)}>Download</Button>
                      </td>
                    </tr>
                  )
                }

                if (t.kind === 'APPOINTMENT') {
                  const a = t.appt
                  return (
                    <tr key={`appt-${a.id}`} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <Badge>APPOINTMENT</Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{new Date(a.slotTime).toLocaleString()}</td>
                      <td className="px-3 py-3 text-slate-700">
                        <div className="text-xs text-slate-600">Appointment #{a.id} • Doctor #{a.doctorId}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge>{a.status}</Badge>
                          <Badge>{a.appoinmentApproval ?? 'PENDING_APPROVAL'}</Badge>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-slate-500">—</span>
                      </td>
                    </tr>
                  )
                }

                const p = t.presc
                return (
                  <tr key={`presc-${p.id}`} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <Badge>PRESCRIPTION</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{new Date(p.issuedAt).toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-700">
                      <div className="text-xs text-slate-600">Prescription #{p.id} • Appointment {p.appointmentId ?? '—'}</div>
                      <div className="mt-1 text-sm text-slate-900">{p.diagnosis?.trim() || 'Diagnosis not provided'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-500">See Prescriptions page</span>
                    </td>
                  </tr>
                )
              })}

              {timeline.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    No medical history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
