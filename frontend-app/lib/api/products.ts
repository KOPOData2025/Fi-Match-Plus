
import { API_CONFIG } from '../api'
import { authenticatedFetch } from './interceptor'

interface ApiResponse<T> {
  status: string
  message: string
  timestamp: string
  data: T
}

export interface ProductListItem {
  id: number
  name: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  keywords: string[]
  oneYearReturn: number
  minInvestment: number
}

export interface ProductDetail {
  id: number
  name: string
  description: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  volatilityIndex: number
  oneYearReturn: number
  mdd: number
  sharpeRatio: number
  keywords: string[]
  minInvestment: number
  holdings: {
    symbol: string
    name: string
    weight: number
    sector: string
  }[]
}

export async function fetchProducts(
  riskLevel?: string,
  search?: string
): Promise<ProductListItem[]> {
  try {
    const params = new URLSearchParams()
    if (riskLevel) params.append('riskLevel', riskLevel)
    if (search) params.append('search', search)

    const queryString = params.toString()
    const apiUrl = `${API_CONFIG.baseUrl}/api/products${queryString ? `?${queryString}` : ''}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] 오류 응답:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<{ products: ProductListItem[] }> = await response.json()

    if (result.status !== 'success') {
      throw new Error(result.message || '상품 목록 조회에 실패했습니다.')
    }

    return result.data.products
  } catch (error) {
    console.error('[API] 상품 목록 조회 오류:', error)
    throw error
  }
}

export async function fetchProductDetail(productId: number): Promise<ProductDetail> {
  try {
    const apiUrl = `${API_CONFIG.baseUrl}/api/products/${productId}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] 오류 응답:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<ProductDetail> = await response.json()

    if (result.status !== 'success') {
      throw new Error(result.message || '상품 상세 조회에 실패했습니다.')
    }

    return result.data
  } catch (error) {
    console.error('[API] 상품 상세 조회 오류:', error)
    throw error
  }
}

