// Holds the in-memory access token outside React so the fetch wrapper (which
// isn't a component) can read/write it without a circular import on
// AuthContext. Never persisted (no localStorage/sessionStorage) - a page
// reload always goes through the silent refresh flow instead.
let currentAccessToken: string | null = null

export function getAccessToken(): string | null {
  return currentAccessToken
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token
}
