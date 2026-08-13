
const TOKEN_KEY = "safewalk"

export function getToken(): {token: string; email: string; isVerified: boolean} | null {
  const localToken = localStorage.getItem(TOKEN_KEY)

  if (!localToken) {
      return null
    }

  const token = JSON.parse(localToken)

  return token.state;
  
}


export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

