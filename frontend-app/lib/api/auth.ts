import { API_CONFIG } from "@/lib/api"
import type { LoginRequest, LoginResponse } from "@/types/auth"

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/auth/login`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify(credentials),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] 로그인 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.status !== "success") {
      throw new Error(result.message || "로그인에 실패했습니다.")
    }
    
    return result.data
  } catch (error) {
    console.error("[API] 로그인 오류:", error)
    throw error
  }
}

export async function logout(token: string): Promise<void> {
  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/auth/logout`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...API_CONFIG.headers,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] 로그아웃 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

  } catch (error) {
    console.error("[API] 로그아웃 오류:", error)
    throw error
  }
}
