import { CreateBacktestData } from '@/types/portfolio'
import { API_CONFIG } from '@/lib/api'
import { authenticatedFetch } from './interceptor'

export interface CreateBacktestRequest {
  title: string
  description?: string
  startAt: string // ISO 8601 datetime string
  endAt: string   // ISO 8601 datetime string
  benchmarkCode: string
  rules: RulesRequest
}

export interface RulesRequest {
  memo?: string
  stopLoss: RuleItemRequest[]
  takeProfit: RuleItemRequest[]
}

export interface RuleItemRequest {
  category: string
  threshold: string
  description?: string
}

export function transformToBacktestRequest(
  formData: CreateBacktestData,
  portfolioId: string,
  benchmarkCode: string
): CreateBacktestRequest {
  const periodCondition = formData.stopConditions.find(condition => condition.type === 'period')
  
  if (!periodCondition?.startDate || !periodCondition?.endDate) {
    throw new Error('기간 설정은 필수입니다.')
  }

  const stopLoss: RuleItemRequest[] = formData.stopConditions
    .filter(condition => condition.type === 'stopLoss')
    .map(condition => ({
      category: condition.criteria || '',
      threshold: condition.value || '',
      description: condition.description
    }))

  const takeProfit: RuleItemRequest[] = formData.stopConditions
    .filter(condition => condition.type === 'takeProfit')
    .map(condition => ({
      category: condition.criteria || '',
      threshold: condition.value || '',
      description: condition.description
    }))

  return {
    title: formData.name,
    description: formData.memo || undefined,
    startAt: `${periodCondition.startDate}T00:00:00`,
    endAt: `${periodCondition.endDate}T23:59:59`,
    benchmarkCode,
    rules: {
      memo: formData.memo || undefined,
      stopLoss,
      takeProfit
    }
  }
}

export interface CreateBacktestResponse {
  status: string
  message: string
  timestamp: string
  data: string // 백테스트 ID
}

export interface BacktestStatusListResponse {
  status: string
  message: string
  timestamp: string
  data: Record<string, 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED'>
}

export interface BacktestDetailResponse {
  status: string
  message: string
  timestamp: string
  data: {
    historyId: string
    name: string
    period: string
    executionTime: number
    benchmarkCode: string
    benchmarkName: string
    metrics: {
      totalReturn: number
      annualizedReturn: number
      volatility: number
      sharpeRatio: number
      maxDrawdown: number
      winRate: number
      profitLossRatio: number
    }
    dailyEquity: Array<{
      date: string
      stocks: Record<string, number>
    }>
    benchmarkData: Array<{
      date: string
      value: number
      dailyReturn: number
    }>
    holdings: Array<{
      stockName: string
      quantity: number
    }>
    report: string  // 마크다운 형식의 리포트
    rules?: {
      id: string
      memo?: string
      stopLoss: Array<{
        category: string
        threshold: string
        description?: string
      }>
      takeProfit: Array<{
        category: string
        threshold: string
        description?: string
      }>
      rebalance: Array<{
        category: string
        threshold: string
        description?: string
      }>
      basicBenchmark?: string
    }
  }
}

export interface BacktestMetadataResponse {
  success: boolean
  message: string
  data: {
    backtestId: number
    portfolioId: number
    title: string
    description?: string
    startAt: string // ISO 8601 datetime string
    endAt: string   // ISO 8601 datetime string
    createdAt: string
    benchmarkCode: string
    status: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    rules: {
      memo?: string
      stopLoss: RuleItemRequest[]
      takeProfit: RuleItemRequest[]
    }
  }
}


export async function createBacktest(
  portfolioId: string,
  requestData: CreateBacktestRequest
): Promise<CreateBacktestResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/backtests/portfolio/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify(requestData),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 생성에 실패했습니다. (${response.status})`)
    }

    const result: CreateBacktestResponse = await response.json()
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] 요청 시간 초과:", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
    }
    
    throw error
  }
}

export async function getPortfolioBacktestStatuses(portfolioId: string): Promise<Record<string, 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED'>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/backtests/portfolios/${portfolioId}/status`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 상태 목록 조회에 실패했습니다. (${response.status})`)
    }

    const result: BacktestStatusListResponse = await response.json()
    return result.data
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] 상태 목록 조회 시간 초과:", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 상태 목록 조회 시간이 초과되었습니다.")
    }
    
    throw error
  }
}

export async function getBacktestDetail(backtestId: string): Promise<BacktestDetailResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/backtests/${backtestId}`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 상세 조회에 실패했습니다. (${response.status})`)
    }

    const result: BacktestDetailResponse = await response.json()
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] 상세 조회 요청 시간 초과:", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 상세 조회 시간이 초과되었습니다.")
    }
    
    throw error
  }
}

export async function getBacktestMetadata(backtestId: string): Promise<BacktestMetadataResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/backtests/${backtestId}/metadata`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 메타데이터 조회에 실패했습니다. (${response.status})`)
    }

    const result: BacktestMetadataResponse = await response.json()
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] 메타데이터 조회 요청 시간 초과:", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 메타데이터 조회 시간이 초과되었습니다.")
    }
    
    throw error
  }
}

export async function updateBacktest(
  backtestId: string,
  requestData: CreateBacktestRequest
): Promise<{ success: boolean; message: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/backtests/${backtestId}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 업데이트에 실패했습니다. (${response.status})`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] 업데이트 요청 시간 초과:", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 업데이트 시간이 초과되었습니다.")
    }
    
    throw error
  }
}

export async function deleteBacktest(backtestId: string, portfolioId: string): Promise<boolean> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/backtests/${backtestId}/portfolio/${portfolioId}`, {
      method: 'DELETE',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `백테스트 삭제에 실패했습니다. (${response.status})`)
    }

    const result: { status: string; message?: string } = await response.json()
    return result.status === 'success'
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Backtest] 삭제 요청 시간 초과:", API_CONFIG.timeout, "ms")
      throw new Error("백테스트 삭제 요청 시간이 초과되었습니다.")
    }
    
    throw error
  }
}
