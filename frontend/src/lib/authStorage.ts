// src/lib/authStorage.ts
interface User {
  email: string
  name: string
  phoneNumber: string
}

interface SignupPayload {
  name: string
  email: string
  password: string
  phoneNumber: string
  // + whatever else your signup form collects — institution, etc.
}


const TOKEN_KEY = "safewalk_token"
const USER_KEY = "auth_user"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  //localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export type { User, SignupPayload }
