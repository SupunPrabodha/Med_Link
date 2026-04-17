import { useEffect, useMemo, useState } from 'react'
import { Bot } from 'lucide-react'
import { api } from '../lib/api'
import { formatApiError } from '../lib/formatApiError'
import { Alert, Badge, Button, Card, Input, Label, Textarea, cn, PageHeader } from '../ui/primitives'

type SymptomAssessment = {
  id: number
  createdAt: string
  riskLevel: string
  summary: string
  advice: string
  recommendedSpecialties: string[]
}

function RiskBadge({ level }: { level: string }) {
  const cls =
    level === 'EMERGENCY'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : level === 'HIGH'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : level === 'MEDIUM'
          ? 'border-slate-200 bg-slate-50 text-slate-800'
          : level === 'LOW'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : undefined

  return <Badge className={cn('font-semibold', cls)}>{level || 'UNKNOWN'}</Badge>
}

export function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState('')
  const [age, setAge] = useState<string>('')
  const [durationDays, setDurationDays] = useState<string>('')

  const [history, setHistory] = useState<SymptomAssessment[]>([])
  const [result, setResult] = useState<SymptomAssessment | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => symptoms.trim().length > 0, [symptoms])

  async function loadHistory() {
    setLoadingHistory(true)
    setError(null)
    try {
      const res = await api.get<SymptomAssessment[]>('/symptoms/history')
      setHistory(res.data ?? [])
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to load symptom history'))
    } finally {
      setLoadingHistory(false)
    }
  }

  async function submit() {
    if (!canSubmit) return

    setLoading(true)
    setError(null)
    try {
      const body: any = { symptoms: symptoms.trim() }

      const a = age.trim()
      if (a !== '') body.age = Number(a)

      const d = durationDays.trim()
      if (d !== '') body.durationDays = Number(d)

      const res = await api.post<SymptomAssessment>('/symptoms/check', body)
      setResult(res.data)
      await loadHistory()
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to check symptoms'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Bot className="h-6 w-6 text-white" />}
        title="AI Symptom Checker"
        description="Get an AI preliminary assessment based on your symptoms."
      />

      <Card>
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">Health Advice Notice</div>
          <div className="text-xs text-slate-500">
            Educational only. This does not provide a medical diagnosis. If you have severe symptoms, seek urgent care.
          </div>
          <Alert tone="warning" className="mt-2">
            If you have chest pain, severe breathing trouble, signs of stroke, severe bleeding, or you feel unsafe, call your
            local emergency number.
          </Alert>
        </div>

        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <Label htmlFor="symptoms">Describe your symptoms</Label>
            <div className="mt-1">
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={5}
                placeholder="Example: fever and sore throat for 2 days, mild cough..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="age">Age (optional)</Label>
            <div className="mt-1">
              <Input
                id="age"
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration in days (optional)</Label>
            <div className="mt-1">
              <Input
                id="duration"
                type="number"
                min={0}
                max={365}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div className="flex items-end justify-end">
            <Button onClick={submit} disabled={!canSubmit || loading} className="w-full md:w-auto">
              {loading ? 'Checking…' : 'Check symptoms'}
            </Button>
          </div>
        </div>

        {result && (
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">Latest result</div>
              <div className="flex items-center gap-2">
                <RiskBadge level={result.riskLevel} />
                <span className="font-mono text-xs text-slate-600">#{result.id}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500">{new Date(result.createdAt).toLocaleString()}</div>
            <div className="text-sm text-slate-800">{result.summary}</div>

            {result.recommendedSpecialties?.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">Recommended specialties</div>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedSpecialties.map((s) => (
                    <Badge key={s} className="border-slate-200 bg-white text-slate-800">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Alert>{result.advice}</Alert>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">History</div>
            <div className="text-xs text-slate-500">Your last 20 checks.</div>
          </div>
          <Button variant="secondary" onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? 'Loading…' : 'Refresh'}
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Risk</th>
                <th className="px-3 py-2 font-semibold">Summary</th>
                <th className="px-3 py-2 font-semibold">Specialties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{new Date(h.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <RiskBadge level={h.riskLevel} />
                  </td>
                  <td className="px-3 py-3 text-slate-700">{h.summary}</td>
                  <td className="px-3 py-3">
                    {h.recommendedSpecialties?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {h.recommendedSpecialties.map((s) => (
                          <Badge key={s} className="border-slate-200 bg-white text-slate-800">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && !loadingHistory && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    No checks yet.
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
