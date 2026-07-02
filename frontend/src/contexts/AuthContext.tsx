import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  apiClient,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_UNAUTHORIZED_EVENT,
  isUnauthorizedError,
} from '../api/client'
import { AuthContext } from './AuthContextState'
import type {
  AuthContextValue,
  AuthResponse,
  CurrentUser,
  MeResponse,
  SignInCredentials,
  SignUpCredentials,
} from '../types/auth'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  )
  const [isLoading, setIsLoading] = useState(true)

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    setToken(null)
    setCurrentUser(null)
  }, [])

  const persistAuth = useCallback((authToken: string, user: CurrentUser) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken)
    setToken(authToken)
    setCurrentUser(user)
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.get<MeResponse>('/auth/me')
      setCurrentUser(response.data.user)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearAuth()
      }

      throw error
    }
  }, [clearAuth])

  const login = useCallback(
    async (credentials: SignInCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/sign_in', {
        user: credentials,
      })

      persistAuth(response.data.token, response.data.user)
    },
    [persistAuth],
  )

  const signup = useCallback(
    async (credentials: SignUpCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/sign_up', {
        user: credentials,
      })

      persistAuth(response.data.token, response.data.user)
    },
    [persistAuth],
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.delete('/auth/sign_out')
    } finally {
      clearAuth()
    }
  }, [clearAuth])

  useEffect(() => {
    const restoreAuth = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        await fetchCurrentUser()
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearAuth()
        }
      } finally {
        setIsLoading(false)
      }
    }

    void restoreAuth()
  }, [clearAuth, fetchCurrentUser, token])

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearAuth)

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearAuth)
    }
  }, [clearAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      token,
      isAuthenticated: Boolean(currentUser && token),
      isLoading,
      login,
      signup,
      logout,
      fetchCurrentUser,
    }),
    [currentUser, fetchCurrentUser, isLoading, login, logout, signup, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
