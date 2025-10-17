import { API_CONFIG } from "../api"
import { authenticatedFetch } from "./interceptor"

interface BatchStockResponse {
  status: string
  message: string
  timestamp: string
  data: {
    marketStatus: {
      isOpen: boolean
      session: string
      nextClose: string
    }
    data: BatchStockItem[]
  }
}

interface BatchStockItem {
  ticker: string
  name: string
  currentPrice: number
  dailyRate: number
  dailyChange: number
  marketCap: number
  sign: string
}

export interface StockPriceData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  sign: string
  lastUpdated: number
}

export async function fetchMultipleStockPrices(codes: string[]): Promise<StockPriceData[]> {
  if (!codes.length) {
    return []
  }

  try {
    const codesParam = codes.join(',')
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks?codes=${encodeURIComponent(codesParam)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[BatchStock] 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: BatchStockResponse = await response.json()

    if (result.status !== 'success') {
      throw new Error(result.message || 'API 요청이 실패했습니다.')
    }

    const stockData: StockPriceData[] = result.data.data.map(item => ({
      symbol: item.ticker,
      name: item.name,
      price: item.currentPrice,
      change: item.dailyChange,
      changePercent: item.dailyRate,
      marketCap: item.marketCap,
      sign: item.sign,
      lastUpdated: Date.now()
    }))

    return stockData
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[BatchStock] 네트워크 연결 실패 - Mixed Content 또는 CORS 문제")
      console.error("[BatchStock] 서버 URL:", API_CONFIG.baseUrl)
      console.error("[BatchStock] 클라이언트 Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
    } else if (error instanceof Error && error.name === "AbortError") {
      console.error("[BatchStock] 요청 시간 초과:", API_CONFIG.timeout, "ms")
    } else {
      console.error("[BatchStock] 배치 주식 API 오류:", error)
    }
    
    return []
  }
}

export async function fetchSingleStockPrice(code: string): Promise<StockPriceData | null> {
  const results = await fetchMultipleStockPrices([code])
  return results.length > 0 ? results[0] : null
}

