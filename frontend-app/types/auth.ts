export interface UserInfo {
  id: number
  name: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  userInfo: UserInfo
}

export interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
  token: string | null
}
