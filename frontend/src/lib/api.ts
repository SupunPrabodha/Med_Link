import axios from 'axios'

// Default to same-origin API. In Docker this is served by the frontend Nginx
// which proxies /api -> http://api-gateway:8090.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL,
})

export function setAuthToken(token: string | null) {
  if (!token) {
    delete api.defaults.headers.common.Authorization
    return
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`
}

// Ensure auth header is set immediately on first load (avoids a race where the
// first API calls happen before AuthContext's effect runs, especially after
// Stripe redirects).
try {
  const stored = localStorage.getItem('medilink.token')
  if (stored) setAuthToken(stored)
} catch {
  // ignore (non-browser environments)
}
