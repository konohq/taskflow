export type CurrentUser = {
  id: number
  name: string
  email: string
}

export type SignInCredentials = {
  email: string
  password: string
}

export type SignUpCredentials = {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export type AuthResponse = {
  user: CurrentUser
  token: string
}

export type MeResponse = {
  user: CurrentUser
}

export type AuthContextValue = {
  currentUser: CurrentUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: SignInCredentials) => Promise<void>
  signup: (credentials: SignUpCredentials) => Promise<void>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
}
