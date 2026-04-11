import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card, Input, Label } from '../ui/primitives'

type PatientProfile = {
  id: number
  userId: number
  fullName: string
  phone: string
  dateOfBirth: string | null
  address: string | null
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

  const [reports, setReports] = useState<MedicalReport[]>([])
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [reportDescription, setReportDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const profileChanged = useMemo(() => {
    if (!profile) return fullName.trim() || phone.trim() || dateOfBirth.trim() || address.trim()
    return (
      fullName !== profile.fullName ||
      phone !== profile.phone ||
      (dateOfBirth || '') !== (profile.dateOfBirth ?? '') ||
      (address || '') !== (profile.address ?? '')
    )
  }, [address, dateOfBirth, fullName, phone, profile])

  async function loadAll() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [profileRes, reportsRes] = await Promise.all([
        api.get<PatientProfile>('/patients/me/profile'),
        api.get<MedicalReport[]>('/patients/me/reports'),
      ])

      setProfile(profileRes.data)
      setFullName(profileRes.data.fullName)
      setPhone(profileRes.data.phone)
      setDateOfBirth(profileRes.data.dateOfBirth ?? '')
      setAddress(profileRes.data.address ?? '')

      setReports(reportsRes.data)
    } catch (err: any) {
      // If profile doesn't exist yet, we still want reports to load.
      const status = err?.response?.status
      if (status === 404) {
        try {
          const reportsRes = await api.get<MedicalReport[]>('/patients/me/reports')
          setReports(reportsRes.data)
          setProfile(null)
        } catch (err2: any) {
          setError(formatApiError(err2, 'Failed to load your data'))
        }
      } else {
        setError(formatApiError(err, 'Failed to load your data'))
      }
    } finally {
      setLoading(false)
    }
  }

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

      const reportsRes = await api.get<MedicalReport[]>('/patients/me/reports')
      setReports(reportsRes.data)
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
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveProfile} disabled={loading || !profileChanged || !fullName.trim() || !phone.trim()}>
            {loading ? 'Saving…' : 'Save profile'}
          </Button>
          {profile?.updatedAt && <Badge>Updated {new Date(profile.updatedAt).toLocaleString()}</Badge>}
        </div>

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
        {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{success}</div>}
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
                      <Button variant="ghost" onClick={() => deleteReport(r.id)} disabled={loading}>
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
        <div className="text-xs text-slate-600">
          Prescriptions and consultation history will appear here once the doctor/prescription workflow is enabled.
        </div>
      </Card>
    </div>
  )
}
