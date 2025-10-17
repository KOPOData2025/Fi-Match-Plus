import { API_CONFIG } from "../api"
import { authenticatedFetch } from "./interceptor"

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

interface NowApiItem {
  ticker: string
  name: string
  currentPrice: number
  dailyRate: number
  dailyChange: number
  marketCap: number
  sign: string
}

interface NowApiData {
  marketStatus: {
    isOpen: boolean
    session: string
    nextClose: string
  }
  data: NowApiItem[]
}

export interface CurrentPriceResult {
  symbol: string
  name?: string
  price: number
  changePercent: number
  change: number
  marketCap: number
  sign: string
}

export interface MarketStatus {
  isOpen: boolean
  session: string
  nextClose: string
}

export async function fetchCurrentPriceByCode(code: string): Promise<CurrentPriceResult | null> {
  if (!code || !code.trim()) {
    return null
  }

  const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/now?code=${encodeURIComponent(code)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      try {
        const text = await response.text()
        console.error("[StockNow] 오류 응답:", text)
      } catch (_) {
      }
      return null
    }

    const result: ApiResponse<NowApiData> = await response.json()
    if (result.status !== "success") {
      return null
    }

    const first = result.data?.data?.[0]
    if (!first) return null

    return {
      symbol: first.ticker,
      name: first.name,
      price: first.currentPrice,
      changePercent: first.dailyRate,
      change: first.dailyChange,
      marketCap: first.marketCap,
      sign: first.sign,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[StockNow] 요청 시간 초과:", API_CONFIG.timeout, "ms")
    } else {
      console.error("[StockNow] fetch 오류:", error)
    }
    return null
  }
}

export async function fetchCurrentPriceWithMarketStatus(code: string): Promise<{ priceData: CurrentPriceResult | null; marketStatus: MarketStatus | null }> {
  if (!code || !code.trim()) {
    return { priceData: null, marketStatus: null }
  }

  const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/now?code=${encodeURIComponent(code)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      try {
        const text = await response.text()
        console.error("[StockNow] 오류 응답:", text)
      } catch (_) {
      }
      return { priceData: null, marketStatus: null }
    }

    const result: ApiResponse<NowApiData> = await response.json()
    if (result.status !== "success") {
      return { priceData: null, marketStatus: null }
    }

    const first = result.data?.data?.[0]
    if (!first) return { priceData: null, marketStatus: null }

    const priceData: CurrentPriceResult = {
      symbol: first.ticker,
      name: first.name,
      price: first.currentPrice,
      changePercent: first.dailyRate,
      change: first.dailyChange,
      marketCap: first.marketCap,
      sign: first.sign,
    }

    const marketStatus: MarketStatus = result.data.marketStatus

    return { priceData, marketStatus }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[StockNow] 요청 시간 초과:", API_CONFIG.timeout, "ms")
    } else {
      console.error("[StockNow] fetch 오류:", error)
    }
    return { priceData: null, marketStatus: null }
  }
}
