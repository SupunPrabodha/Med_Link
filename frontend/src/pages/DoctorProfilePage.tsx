import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Badge, Button, Card, Input, Label } from '../ui/primitives'

type DoctorProfile = {
  id: number
  userId: number
  fullName: string
  registrationNo: string
  specialization: string
  documentsUrl?: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  updatedAt: string
  rejectionReason?: string | null
}

export function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [registrationNo, setRegistrationNo] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [documentsUrl, setDocumentsUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const res = await api.get<DoctorProfile>('/doctors/me/profile')
      setProfile(res.data)
      setFullName(res.data.fullName)
      setRegistrationNo(res.data.registrationNo)
      setSpecialization(res.data.specialization)
      setDocumentsUrl(res.data.documentsUrl ?? '')
    } catch (err: any) {
      setProfile(null)
      // if not created yet, server likely returns 404
    }
  }

  async function save() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post<DoctorProfile>('/doctors/me/profile', {
        fullName: fullName.trim(),
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
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">My doctor profile</div>
            <div className="text-xs text-slate-500">Submit details for admin verification</div>
          </div>
          {profile && <Badge>{profile.status}</Badge>}
        </div>

        {profile?.rejectionReason && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Rejected: {profile.rejectionReason}
          </div>
        )}

        {profile && profile.status !== 'VERIFIED' && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            Your profile is <span className="font-semibold">{profile.status}</span>. You will appear in the Doctors list only after an admin verifies you.
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <div className="mt-1">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Registration no</Label>
            <div className="mt-1">
              <Input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Specialization</Label>
            <div className="mt-1">
              <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g., Dermatologist" />
            </div>
          </div>
          <div>
            <Label>Documents URL (optional)</Label>
            <div className="mt-1">
              <Input value={documentsUrl} onChange={(e) => setDocumentsUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
        {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{success}</div>}

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
        <div className="text-xs text-slate-500">
          API: <span className="font-mono">POST /api/doctors/me/profile</span>, <span className="font-mono">GET /api/doctors/me/profile</span>
        </div>
      </Card>
    </div>
  )
}
