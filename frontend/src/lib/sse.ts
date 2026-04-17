type SseEvent = {
	id?: string
	event?: string
	data: string
}

function buildUrl(path: string) {
	const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'
	const p = path.startsWith('/') ? path : `/${path}`
	return `${baseURL}${p}`
}

function parseSseChunk(chunk: string): SseEvent | null {
	const lines = chunk.split(/\r?\n/)
	let id: string | undefined
	let event: string | undefined
	const dataLines: string[] = []

	for (const raw of lines) {
		if (!raw) continue
		if (raw.startsWith(':')) continue
		const idx = raw.indexOf(':')
		const field = idx === -1 ? raw : raw.slice(0, idx)
		const value = idx === -1 ? '' : raw.slice(idx + 1).trimStart()
		if (field === 'id') id = value
		else if (field === 'event') event = value
		else if (field === 'data') dataLines.push(value)
	}

	if (dataLines.length === 0 && !event) return null
	return { id, event, data: dataLines.join('\n') }
}

export type SseConnectOptions = {
	onEvent: (evt: SseEvent) => void
	onError?: (err: unknown) => void
	reconnectMs?: number
}

// Uses fetch streaming so we can send Authorization header (EventSource can't).
export function connectSse(path: string, token: string, opts: SseConnectOptions) {
	const abort = new AbortController()
	const reconnectMs = Math.max(250, opts.reconnectMs ?? 1500)
	let closed = false

	async function run() {
		while (!closed) {
			try {
				const res = await fetch(buildUrl(path), {
					method: 'GET',
					headers: {
						Accept: 'text/event-stream',
						Authorization: `Bearer ${token}`,
					},
					signal: abort.signal,
				})

				if (!res.ok) {
					throw new Error(`SSE failed: HTTP ${res.status}`)
				}
				if (!res.body) {
					throw new Error('SSE failed: response body not available')
				}

				const reader = res.body.getReader()
				const decoder = new TextDecoder('utf-8')
				let buffer = ''

				while (!closed) {
					const { value, done } = await reader.read()
					if (done) break
					buffer += decoder.decode(value, { stream: true })

					let idx: number
					// SSE event delimiter is a blank line
					while ((idx = buffer.indexOf('\n\n')) !== -1) {
						const raw = buffer.slice(0, idx)
						buffer = buffer.slice(idx + 2)
						const evt = parseSseChunk(raw)
						if (evt) opts.onEvent(evt)
					}
				}
			} catch (err) {
				if (closed) return
				opts.onError?.(err)
				await new Promise((r) => window.setTimeout(r, reconnectMs))
			}
		}
	}

	void run()

	return {
		close() {
			closed = true
			abort.abort()
		},
	}
}
