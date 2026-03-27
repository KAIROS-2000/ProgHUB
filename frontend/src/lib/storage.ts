const ACCESS = 'codequest_access_token'
const REFRESH = 'codequest_refresh_token'
const ACCESS_TTL_SECONDS = 30 * 60
const REFRESH_TTL_SECONDS = 14 * 24 * 60 * 60

function readCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : ''
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

export function getAccessToken() {
  if (typeof window === 'undefined') return ''
  return readCookie(ACCESS)
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return ''
  return readCookie(REFRESH)
}

export function saveTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return
  writeCookie(ACCESS, accessToken, ACCESS_TTL_SECONDS)
  writeCookie(REFRESH, refreshToken, REFRESH_TTL_SECONDS)
}

export function clearTokens() {
  if (typeof window === 'undefined') return
  removeCookie(ACCESS)
  removeCookie(REFRESH)
}
