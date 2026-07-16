import { useEffect, useMemo, useState } from 'react'

import { getCurrentUser, loginRequest, logoutRequest } from '../api/services/auth'
import { AuthContext } from './AuthContextBase'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('pollo_rey_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        localStorage.removeItem('pollo_rey_token')
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  async function login(credentials) {
    const data = await loginRequest(credentials)
    localStorage.setItem('pollo_rey_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      localStorage.removeItem('pollo_rey_token')
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      user,
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
