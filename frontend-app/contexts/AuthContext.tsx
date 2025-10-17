"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { login as loginApi, logout as logoutApi } from "@/lib/api/auth"
import type { AuthState, UserInfo, LoginRequest } from "@/types/auth"

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = "auth_data"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
      if (storedAuth) {
        const { user, token } = JSON.parse(storedAuth)
        setAuthState({
          isAuthenticated: true,
          user,
          token,
        })
      }
    } catch (error) {
      console.error("인증 정보 복원 실패:", error)
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      const response = await loginApi(credentials)
      
      const authData = {
        user: response.userInfo,
        token: response.accessToken,
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))

      setAuthState({
        isAuthenticated: true,
        user: response.userInfo,
        token: response.accessToken,
      })
    } catch (error) {
      console.error("로그인 실패:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (authState.token) {
        await logoutApi(authState.token)
      }
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error)
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      })
    }
  }

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
