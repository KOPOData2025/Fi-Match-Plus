import { API_CONFIG } from "@/lib/api"

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  
  try {
    const storedAuth = localStorage.getItem("auth_data")
    if (storedAuth) {
      const { token } = JSON.parse(storedAuth)
      return token
    }
  } catch (error) {
    console.error("토큰 조회 실패:", error)
  }
  return null
}

function handleUnauthorized() {
  if (typeof window === "undefined") return
  
  localStorage.removeItem("auth_data")
  
  window.location.href = "/login"
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken()
  
  const headers = {
    ...API_CONFIG.headers,
    ...options.headers,
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (response.status === 401) {
      handleUnauthorized()
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.")
    }
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
