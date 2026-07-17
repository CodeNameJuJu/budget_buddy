// Shared token storage for the auth session.
//
// Two sessions can coexist in one browser:
// - localStorage holds the shared "remember me" session (all tabs)
// - sessionStorage holds a tab-scoped session
//
// The tab-scoped sessionStorage session always takes precedence over the
// shared localStorage session, so a non-remembered login in one tab does not
// interfere with a remembered login in other tabs.

export interface TokenBundle {
  access_token: string
  refresh_token: string
  expires_in: number
}

const tokenKeys = ['access_token', 'refresh_token', 'token_expires_at']

export function clearStorageTokens(storage: Storage): void {
  tokenKeys.forEach(key => storage.removeItem(key))
}

// Returns the storage holding the active session, or null when logged out
export function getActiveStorage(): Storage | null {
  if (sessionStorage.getItem('refresh_token')) return sessionStorage
  if (localStorage.getItem('refresh_token')) return localStorage
  return null
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token')
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token')
}

export function getTokenExpiresAt(): string | null {
  return getActiveStorage()?.getItem('token_expires_at') ?? null
}

// Writes a token bundle to the given storage
export function writeTokens(storage: Storage, tokens: TokenBundle): void {
  storage.setItem('access_token', tokens.access_token)
  storage.setItem('refresh_token', tokens.refresh_token)
  storage.setItem('token_expires_at', (Date.now() + tokens.expires_in * 1000).toString())
}

// Stores tokens for a fresh login. Always clears this tab's session tokens so
// the new session takes effect; only replaces the shared localStorage tokens
// when this is a "remember me" login, so a remembered user in other tabs is
// not logged out by a non-remembered login.
export function storeLoginTokens(tokens: TokenBundle, rememberMe: boolean): void {
  clearStorageTokens(sessionStorage)
  if (rememberMe) {
    clearStorageTokens(localStorage)
  }
  writeTokens(rememberMe ? localStorage : sessionStorage, tokens)
}

// Clears the active session only, leaving any other session intact. Clears
// both storages when no active session can be determined.
export function clearActiveSession(): void {
  const storage = getActiveStorage()
  if (storage) {
    clearStorageTokens(storage)
  } else {
    clearStorageTokens(sessionStorage)
    clearStorageTokens(localStorage)
  }
}
