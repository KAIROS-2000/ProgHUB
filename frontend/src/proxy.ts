import { NextRequest, NextResponse } from 'next/server'

type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin'

interface JwtHeader {
  alg?: string
}

interface JwtPayload {
  role?: string
  type?: string
  exp?: number
}

const ACCESS_COOKIE = 'codequest_access_token'
const REFRESH_COOKIE = 'codequest_refresh_token'
const KNOWN_ROLES: UserRole[] = ['student', 'teacher', 'admin', 'superadmin']
const AUTH_ROUTES = ['/auth/login', '/auth/register']
const ROLE_RULES: Array<{ path: string; roles: UserRole[] }> = [
  { path: '/dashboard', roles: KNOWN_ROLES },
  { path: '/roadmap', roles: KNOWN_ROLES },
  { path: '/lessons', roles: KNOWN_ROLES },
  { path: '/forum', roles: KNOWN_ROLES },
  { path: '/leaderboard', roles: KNOWN_ROLES },
  { path: '/profile', roles: KNOWN_ROLES },
  { path: '/teacher', roles: ['teacher'] },
  { path: '/admin', roles: ['admin', 'superadmin'] },
  { path: '/superadmin', roles: ['superadmin'] },
]

function pathMatches(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`)
}

function parseBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const padded = `${normalized}${'='.repeat(paddingLength)}`
  try {
    return atob(padded)
  } catch {
    return null
  }
}

function parseBase64UrlBytes(value: string): Uint8Array | null {
  const decoded = parseBase64Url(value)
  if (!decoded) return null
  const bytes = new Uint8Array(decoded.length)
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }
  return bytes
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer
}

function parseTokenPart<T>(value: string): T | null {
  const decoded = parseBase64Url(value)
  if (!decoded) return null
  try {
    return JSON.parse(decoded) as T
  } catch {
    return null
  }
}

function isKnownRole(value: string | undefined): value is UserRole {
  return !!value && KNOWN_ROLES.includes(value as UserRole)
}

async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  const secret = process.env.SECRET_KEY
  if (!secret) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerPart, payloadPart, signaturePart] = parts
  if (!headerPart || !payloadPart || !signaturePart) return null

  const header = parseTokenPart<JwtHeader>(headerPart)
  if (!header || header.alg !== 'HS256') return null

  const payload = parseTokenPart<JwtPayload>(payloadPart)
  if (!payload || payload.type !== 'access' || !isKnownRole(payload.role) || typeof payload.exp !== 'number') {
    return null
  }
  if (payload.exp * 1000 <= Date.now()) return null

  const signatureBytes = parseBase64UrlBytes(signaturePart)
  if (!signatureBytes) return null

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(signatureBytes),
    toArrayBuffer(new TextEncoder().encode(`${headerPart}.${payloadPart}`)),
  )
  if (!isValid) return null

  return payload
}

function loginUrl(request: NextRequest) {
  return new URL('/auth/login', request.url)
}

function dashboardUrl(request: NextRequest) {
  return new URL('/dashboard', request.url)
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  return response
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAuthRoute = AUTH_ROUTES.some((route) => pathMatches(pathname, route))
  const roleRule = ROLE_RULES.find((rule) => pathMatches(pathname, rule.path))

  if (!isAuthRoute && !roleRule) {
    return NextResponse.next()
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value

  if (!token) {
    if (isAuthRoute) return NextResponse.next()
    return NextResponse.redirect(loginUrl(request))
  }

  const payload = await verifyAccessToken(token)
  if (!payload || !isKnownRole(payload.role)) {
    if (isAuthRoute) {
      return clearAuthCookies(NextResponse.next())
    }
    return clearAuthCookies(NextResponse.redirect(loginUrl(request)))
  }

  if (isAuthRoute) {
    return NextResponse.redirect(dashboardUrl(request))
  }

  if (roleRule && !roleRule.roles.includes(payload.role)) {
    return NextResponse.redirect(dashboardUrl(request))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/roadmap/:path*',
    '/lessons/:path*',
    '/forum/:path*',
    '/leaderboard/:path*',
    '/profile/:path*',
    '/teacher/:path*',
    '/admin/:path*',
    '/superadmin/:path*',
    '/auth/login/:path*',
    '/auth/register/:path*',
  ],
}
