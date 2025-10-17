import type { StockSearchResult } from "@/types/stock"
import { API_CONFIG } from "../api"
import { authenticatedFetch } from "./interceptor"

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

export interface StockSearchAPIResponse {
  status: string
  message: string
  timestamp: string
  data: {
    results: StockSearchResult[]
    total: number
  }
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query.trim()) {
    return []
  }

  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/search?keyword=${encodeURIComponent(query)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[StockSearch] 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: StockSearchAPIResponse = await response.json()
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'API 요청이 실패했습니다.')
    }
    
    const sanitized = (data.data.results || []).map(r => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
    }))
    return sanitized
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[StockSearch] 네트워크 연결 실패 - Mixed Content 또는 CORS 문제")
      console.error("[StockSearch] 서버 URL:", API_CONFIG.baseUrl)
      console.error("[StockSearch] 클라이언트 Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
    } else if (error instanceof Error && error.name === "AbortError") {
      console.error("[StockSearch] 요청 시간 초과:", API_CONFIG.timeout, "ms")
    } else {
      console.error("[StockSearch] 주식 검색 API 오류:", error)
    }
    
    return []
  }
}

export async function getPopularStocks(): Promise<StockSearchResult[]> {
  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/popular`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[StockSearch] 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: StockSearchAPIResponse = await response.json()
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'API 요청이 실패했습니다.')
    }
    
    const sanitized = (data.data.results || []).map(r => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
    }))
    return sanitized
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[StockSearch] 네트워크 연결 실패 - Mixed Content 또는 CORS 문제")
      console.error("[StockSearch] 서버 URL:", API_CONFIG.baseUrl)
      console.error("[StockSearch] 클라이언트 Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
    } else if (error instanceof Error && error.name === "AbortError") {
      console.error("[StockSearch] 요청 시간 초과:", API_CONFIG.timeout, "ms")
    } else {
      console.error("[StockSearch] 인기 주식 API 오류:", error)
    }
    
    return []
  }
}
