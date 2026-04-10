import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken } from '../lib/api'
import { isJwtExpired, parseJwt } from '../lib/jwt'

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'

type AuthUser = {
  uid: number
  email: string
  roles: Role[]
}

type TokenResponse = {
  accessToken: string
  tokenType: string
}

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, role: Role) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'medilink.token'

function toUser(token: string): AuthUser | null {
  const claims = parseJwt(token)
  if (!claims || isJwtExpired(claims)) return null
  const roles = (claims.roles ?? []).filter(Boolean) as Role[]
  if (!claims.uid || !claims.email || roles.length === 0) return null
  return { uid: claims.uid, email: claims.email, roles }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

  const user = useMemo(() => (token ? toUser(token) : null), [token])

  useEffect(() => {
    setAuthToken(token)
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  }, [token])

  async function login(email: string, password: string) {
    const res = await api.post<TokenResponse>('/api/auth/login', { email, password })
    setToken(res.data.accessToken)
  }

  async function register(email: string, password: string, role: Role) {
    const res = await api.post<TokenResponse>('/api/auth/register', { email, password, role })
    setToken(res.data.accessToken)
  }

  function logout() {
    setToken(null)
  }

  const value: AuthContextValue = { token, user, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function hasRole(user: AuthUser | null, role: Role) {
  return !!user?.roles?.includes(role)
}
