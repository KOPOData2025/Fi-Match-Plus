
export interface ModelPortfolio {
  id: number
  name: string
  description: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  volatilityIndex: number
  oneYearReturn: number
  mdd: number // Maximum Drawdown
  sharpeRatio: number
  keywords: string[]
  dailyHistory: PortfolioDailyHistory[]
  holdings: PortfolioHolding[]
  totalValue: number
  minInvestment: number
}

export interface PortfolioHolding {
  symbol: string
  name: string
  weight: number
  sector: string
  price: number
  change: number
  changePercent: number
}

export interface PortfolioDailyHistory {
  date: string
  value: number
  return: number
}

export interface ProductListCard {
  id: number
  name: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  keywords: string[]
  oneYearReturn: number
  minInvestment: number
}

export interface ProductState {
  products: ModelPortfolio[]
  selectedProduct: ModelPortfolio | null
  isLoading: boolean
  error: string | null
}

export const RISK_LEVEL_LABELS = {
  LOW: '위험도 낮음',
  MEDIUM: '위험도 보통',
  HIGH: '위험도 높음',
  VERY_HIGH: '위험도 매우 높음'
} as const

export const RISK_LEVEL_COLORS = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  HIGH: 'text-orange-600 bg-orange-50',
  VERY_HIGH: 'text-red-600 bg-red-50'
} as const
