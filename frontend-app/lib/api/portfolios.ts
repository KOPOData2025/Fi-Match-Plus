import { API_CONFIG } from "../api"
import { authenticatedFetch } from "./interceptor"
import type { PortfolioAnalysis } from "@/types/portfolio"

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

interface PortfolioSummaryData {
  totalAssets: number
  dailyTotalReturn: number
  dailyTotalChange: number
}

interface HoldingStock {
  ticker: string
  name: string
  weight: number
  value: number
  dailyRate: number
  shares: number
}

interface Portfolio {
  id: number
  name: string
  description: string
  holdingStocks: HoldingStock[]
  totalAssets: number
  dailyRate: number
  dailyChange: number
}

interface PortfolioListData {
  portfolios: Portfolio[]
}

export interface PortfolioSummary {
  totalAssets: number
  dailyTotalReturn: number
  dailyTotalChange: number
}

export interface PortfolioWithDetails {
  id: number
  name: string
  description: string
  holdingStocks: HoldingStock[]
  totalAssets: number
  dailyRate: number
  dailyChange: number
}

export interface PortfolioDetailData {
  portfolioId: number
  name: string
  description: string
  holdings: Array<{
    ticker: string
    name: string
    weight: number
    value: number
    dailyRate: number
  }>
  ruleId: string
  rules: {
    id: string
    memo: string
    basicBenchmark: string
    benchmark: {
      code: string
      name: string
      description: string
    }
    rebalance: Array<{
      category: string
      threshold: string
      description: string
    }>
    stopLoss: Array<{
      category: string
      threshold: string
      description: string
    }>
    takeProfit: Array<{
      category: string
      threshold: string
      description: string
    }>
    createdAt: string
    updatedAt: string
  }
  analysis?: PortfolioAnalysis
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary | null> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/summary`

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
      } catch (_) {
      }
      return null
    }

    const result: ApiResponse<PortfolioSummaryData> = await response.json()
    if (result.status !== "success") {
      return null
    }

    return {
      totalAssets: result.data.totalAssets,
      dailyTotalReturn: result.data.dailyTotalReturn,
      dailyTotalChange: result.data.dailyTotalChange,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
    } else {
    }
    return null
  }
}

export async function fetchPortfolioList(): Promise<PortfolioWithDetails[]> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios`

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
      } catch (_) {
      }
      return []
    }

    const result: ApiResponse<PortfolioListData> = await response.json()
    if (result.status !== "success") {
      return []
    }

    return result.data.portfolios.map((portfolio) => ({
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      holdingStocks: portfolio.holdingStocks,
      totalAssets: portfolio.totalAssets,
      dailyRate: portfolio.dailyRate,
      dailyChange: portfolio.dailyChange,
    }))
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
    } else {
    }
    return []
  }
}

export async function fetchPortfolioDetail(portfolioId: string): Promise<PortfolioDetailData | null> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/${portfolioId}/long`

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
      } catch (_) {
      }
      return null
    }

    const result: ApiResponse<PortfolioDetailData> = await response.json()
    
    if (result.status !== "success") {
      return null
    }

    return result.data
  } catch (error) {
    
    if (error instanceof Error) {
      
      if (error.name === "AbortError") {
      } else if (error.name === "TypeError") {
      }
    }
    
    return null
  }
}

export async function fetchPortfolioAnalysis(portfolioId: string): Promise<PortfolioAnalysis | null> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/${portfolioId}/analysis`

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
      } catch (_) {
      }
      return null
    }

    const result: ApiResponse<PortfolioAnalysis> = await response.json()
    
    if (result.status !== "success") {
      return null
    }

    return result.data
  } catch (error) {
    
    if (error instanceof Error) {
      
      if (error.name === "AbortError") {
      } else if (error.name === "TypeError") {
      }
    } else {
    }
    
    return null
  }
}

export async function fetchPortfolioAnalysisDetail(portfolioId: string): Promise<PortfolioAnalysis | null> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/${portfolioId}/detail`

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
      } catch (_) {
      }
      return null
    }

    const result: ApiResponse<PortfolioAnalysis> = await response.json()
    
    if (result.status !== "success") {
      return null
    }

    return result.data
  } catch (error) {
    
    if (error instanceof Error) {
      
      if (error.name === "AbortError") {
      } else if (error.name === "TypeError") {
      }
    } else {
    }
    
    return null
  }
}

export async function deletePortfolio(portfolioId: number): Promise<boolean> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/${portfolioId}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(apiUrl, {
      method: "DELETE",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      try {
        const text = await response.text()
        console.error("포트폴리오 삭제 실패:", text)
      } catch (_) {
      }
      return false
    }

    const result: ApiResponse<any> = await response.json()
    
    return result.status === "success"
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("포트폴리오 삭제 요청 시간 초과")
      } else if (error.name === "TypeError") {
        console.error("포트폴리오 삭제 중 네트워크 오류")
      }
    }
    return false
  }
}

export async function updatePortfolio(portfolioId: number, portfolioData: any): Promise<any> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolios/${portfolioId}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(apiUrl, {
      method: "PUT",
      headers: API_CONFIG.headers,
      body: JSON.stringify(portfolioData),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      try {
        const text = await response.text()
        console.error("포트폴리오 수정 실패:", text)
        throw new Error(`포트폴리오 수정에 실패했습니다 (${response.status})`)
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error("포트폴리오 수정에 실패했습니다")
      }
    }

    const result: ApiResponse<any> = await response.json()
    
    if (result.status !== "success") {
      throw new Error(result.message || "포트폴리오 수정에 실패했습니다")
    }

    return result.data
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다")
      } else if (error.name === "TypeError") {
        throw new Error("네트워크 오류가 발생했습니다")
      }
      throw error
    }
    throw new Error("알 수 없는 오류가 발생했습니다")
  }
}

export interface AnalysisStatusData {
  portfolio_id: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  error_message?: string | null
}

export async function fetchAnalysisStatus(portfolioId: string): Promise<AnalysisStatusData | null> {
  const apiUrl = `${API_CONFIG.baseUrl}/api/portfolio-analysis/${portfolioId}/status`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(apiUrl, {
      method: "GET",
      headers: {
        ...API_CONFIG.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      try {
        const text = await response.text()
      } catch (_) {
      }
      return null
    }

    const result: ApiResponse<AnalysisStatusData> = await response.json()
    
    if (result.status !== "success") {
      return null
    }

    return result.data
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
    }
    return null
  }
}
