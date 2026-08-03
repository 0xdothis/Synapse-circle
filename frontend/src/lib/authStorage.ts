
const TOKEN_KEY = "safewalk"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}


export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

