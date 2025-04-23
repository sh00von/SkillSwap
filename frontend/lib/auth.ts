"use client"

// Helper functions for authentication

// Check if user is logged in
export const isAuthenticated = (): boolean => {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("token")
  }
  return false
}

// Get the authentication token
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

// Log out the user
export const logout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
  }
}
