// src/lib/requireAuth.ts
import { redirect } from "react-router"
import { isAuthenticated, getStoredUser } from "@/lib/authStorage"

// Just needs a valid token — used for /verify-email
export function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect("/login")
  }
  return null
}

// Needs a valid token AND a verified account — used for onboarding/dashboard
export function requireVerifiedAuth() {
  if (!isAuthenticated()) {
    throw redirect("/login")
  }
  const user = getStoredUser()
  if (!user) {
    throw redirect("/verify-email")
  }
  return null
}
