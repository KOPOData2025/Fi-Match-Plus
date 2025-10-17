import type { BacktestResponse } from "@/types/portfolio"
import { authenticatedFetch } from "./api/interceptor"

export const API_CONFIG = {
  baseUrl: "https://fi-match.shop",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
}

const TIMEFRAME_MAPPING: Record<string, string> = {
  "1D": "1d",
}

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

interface ChartDataResponse {
  timestamp: string
  open: number
  close: number
  high: number
  low: number
  volume: number
}

export async function fetchChartData(
  symbol: string, 
  timeFrame: string, 
  startDate?: string, 
  endDate?: string
): Promise<ChartDataResponse[]> {
  try {
    const mappedInterval = TIMEFRAME_MAPPING[timeFrame] || timeFrame.toLowerCase()
    
    const params = new URLSearchParams({
      stockId: symbol,
      interval: mappedInterval
    })
    
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/chart?${params.toString()}`

    let response: Response
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      response = await authenticatedFetch(apiUrl, {
        method: "GET",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
    } catch (fetchError: unknown) {
      if (fetchError instanceof TypeError) {
        console.error("네트워크 연결 실패 - Mixed Content 또는 CORS 문제")
        console.error("HTTPS 환경에서 HTTP localhost 연결 불가")
        console.error("서버 URL:", API_CONFIG.baseUrl)
        console.error("클라이언트 Origin:", typeof window !== "undefined" ? window.location.origin : "unknown")
        throw new Error("네트워크 연결 실패: HTTPS 환경에서 HTTP localhost 연결 불가")
      } else if (
        typeof fetchError === "object" &&
        fetchError !== null &&
        "name" in fetchError &&
        (fetchError as { name?: string }).name === "AbortError"
      ) {
        console.error("요청 시간 초과:", API_CONFIG.timeout, "ms")
        throw new Error("요청 시간 초과")
      } else {
        console.error("예상치 못한 fetch 오류:", fetchError)
        throw new Error("네트워크 요청 실패")
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<ChartDataResponse[]> = await response.json()

    if (result.status !== "success") {
      throw new Error(result.message || "데이터 조회에 실패했습니다.")
    }

    return result.data
  } catch (error: unknown) {
    throw error as unknown as Error
  }
}

export function transformChartData(apiData: ChartDataResponse[]) {
  return apiData.map((item) => ({
    timestamp: new Date(item.timestamp).getTime(),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
  }))
}

interface CreatePortfolioResponse {
  id: string
  name: string
  description: string
  totalValue: number
  stockHoldings: any[]
  rule: any
  createdAt: string
  updatedAt: string
}

export async function createPortfolio(portfolioData: any): Promise<CreatePortfolioResponse> {
  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const requestBody = {
      ...portfolioData,
      holdings: portfolioData.stockHoldings,
      rules: portfolioData.rule,
    }
    delete (requestBody as any).stockHoldings
    delete (requestBody as any).rule

    const response = await authenticatedFetch(apiUrl, {
      method: "POST",
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<CreatePortfolioResponse> = await response.json()

    if (result.status !== "success") {
      throw new Error(result.message || "포트폴리오 생성에 실패했습니다.")
    }

    return result.data
  } catch (error) {
    console.error("[API] 포트폴리오 생성 오류:", error)
    throw error
  }
}

export async function fetchPortfolioBacktests(portfolioId: string): Promise<BacktestResponse[]> {
  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/backtests/portfolio/${portfolioId}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: "GET",
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<BacktestResponse[]> = await response.json()

    if (result.status !== "success") {
      throw new Error(result.message || "백테스트 내역 조회에 실패했습니다.")
    }

    return result.data
  } catch (error) {
    console.error("[API] 백테스트 조회 오류:", error)
    throw error
  }
}

export async function executeBacktest(backtestId: number): Promise<{ success: boolean; message?: string; backtestId?: string }> {
  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/backtests/${backtestId}/execute`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: "POST",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    return { 
      success: true, 
      message: result.message || "백테스트 실행이 시작되었습니다",
      backtestId: result.data 
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[API] 백테스트 실행 요청 시간 초과")
      throw new Error("백테스트 실행 요청 시간이 초과되었습니다.")
    } else {
      console.error("[API] 백테스트 실행 오류:", error)
      throw error instanceof Error ? error : new Error("백테스트 실행 요청에 실패했습니다.")
    }
  }
}

export interface StockMultiData {
  ticker: string
  name: string
  currentPrice: number
  dailyRate: number
  dailyChange: number
  marketCap: number
  sign: string
}

export interface StockMultiResponse {
  status: string
  message: string
  timestamp: string
  data: {
    marketStatus: {
      isOpen: boolean
      session: string
      nextClose: string
    }
    data: StockMultiData[]
  }
}

export async function fetchMultiStockPrices(codes: string[]): Promise<StockMultiData[]> {
  try {
    const params = codes.map(code => `codes=${code}`).join('&')
    const apiUrl = `${API_CONFIG.baseUrl}/api/stocks/multi?${params}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] 오류 응답:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: StockMultiResponse = await response.json()

    if (result.status !== "success") {
      throw new Error(result.message || "주식 데이터 조회에 실패했습니다.")
    }

    return result.data.data
  } catch (error) {
    console.error("[API] 다중 주식 조회 오류:", error)
    throw error
  }
}
