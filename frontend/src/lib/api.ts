import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090'

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
