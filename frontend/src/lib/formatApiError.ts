export function formatApiError(err: any, fallback: string) {
  const data = err?.response?.data
  if (!data) return fallback

  if (typeof data === 'string') return data

  const message = typeof data?.message === 'string' ? data.message : undefined
  const errorText = typeof data?.error === 'string' ? data.error : undefined
  const status = typeof data?.status === 'number' ? data.status : undefined

  const violations = Array.isArray(data?.violations) ? data.violations : []
  if (message && violations.length > 0) {
    const details = violations
      .map((v: any) => {
        const field = typeof v?.field === 'string' ? v.field : 'field'
        const msg = typeof v?.message === 'string' ? v.message : 'invalid'
        return `${field}: ${msg}`
      })
      .join(', ')
    return `${message} (${details})`
  }

  if (message) return message
  if (errorText) return errorText
  if (status) return `HTTP ${status}`
  return fallback
}
