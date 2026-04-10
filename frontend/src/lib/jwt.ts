export type JwtClaims = {
  uid?: number
  email?: string
  roles?: string[]
  exp?: number
  iat?: number
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  )
}

export function parseJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtClaims
    return payload
  } catch {
    return null
  }
}

export function isJwtExpired(claims: JwtClaims | null): boolean {
  if (!claims?.exp) return false
  const nowSeconds = Math.floor(Date.now() / 1000)
  return claims.exp <= nowSeconds
}
