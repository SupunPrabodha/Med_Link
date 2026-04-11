function toFieldLabel(field: string) {
  const overrides: Record<string, string> = {
    doctorId: 'Doctor',
    slotTime: 'Appointment time',
    appointmentId: 'Appointment',
    fullName: 'Full name',
    registrationNo: 'Registration number',
    documentsUrl: 'Documents link',
  }
  if (overrides[field]) return overrides[field]

  const spaced = field.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  const parts = spaced.split(/[\s_]+/).filter(Boolean)
  if (parts.length === 0) return 'Field'

  const normalized = parts.map((p) => (p.toLowerCase() === 'id' ? 'ID' : p.toLowerCase()))
  const first = normalized[0]
  const firstLabel = first === 'ID' ? 'ID' : first.charAt(0).toUpperCase() + first.slice(1)
  const rest = normalized.slice(1).map((p) => (p === 'id' ? 'ID' : p))
  return [firstLabel, ...rest].join(' ')
}

export function formatApiError(err: any, fallback: string) {
  const data = err?.response?.data
  if (!data) return fallback

  if (typeof data === 'string') return data

  const message = typeof data?.message === 'string' ? data.message : undefined
  const errorText = typeof data?.error === 'string' ? data.error : undefined
  const status = typeof data?.status === 'number' ? data.status : undefined

  const violations = Array.isArray(data?.violations) ? data.violations : []
  if (violations.length > 0) {
    const details = violations
      .slice(0, 4)
      .map((v: any) => {
        const field = typeof v?.field === 'string' ? v.field : 'field'
        const msg = typeof v?.message === 'string' ? v.message : 'invalid'
        return `${toFieldLabel(field)}: ${msg}`
      })
      .join('; ')
    return message ? `${message}: ${details}` : details
  }

  if (message) return message
  if (errorText) return errorText
  if (status) return `Request failed (HTTP ${status})`
  return fallback
}
