import axios from 'axios'
import type { AxiosError } from 'axios'

export const AUTH_TOKEN_STORAGE_KEY = 'taskflow_ai_auth_token'
export const AUTH_UNAUTHORIZED_EVENT = 'taskflow-ai:unauthorized'
export const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1'
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
    }

    return Promise.reject(error)
  },
)

export function isUnauthorizedError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401
}
