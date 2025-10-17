
export interface StockHolding {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  totalValue: number
  change: number
  changePercent: number
  weight: number
}

export interface RuleItem {
  category: string
  threshold?: string
  description?: string
}

export interface Rule {
  memo: string
  rebalance: RuleItem[]
  stopLoss: RuleItem[]
  takeProfit: RuleItem[]
}

export interface CreatePortfolioData {
  name: string
  totalValue: number          // 자동 계산되는 포트폴리오 가치
  description: string
  stockHoldings: StockHolding[]
  rule: Rule
}

export interface BacktestMetrics {
  total_return: number
  annualized_return: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  profit_loss_ratio: number
}

export interface BacktestData {
  id: number
  name: string
  period: string
  execution_time: number
  createdAt: string
  metrics: BacktestMetrics
  daily_returns: Array<{
    date: string
    [key: string]: string | number
  }>
}

export type BacktestStatus = 'created' | 'running' | 'completed' | 'failed'

export interface BacktestResponse {
  id: number
  name: string
  period: string
  execution_time: number
  createdAt: string
  status: BacktestStatus
  metrics?: BacktestMetrics  // 실행 완료된 경우에만 존재
  daily_returns?: Array<{
    date: string
    [key: string]: string | number
  }>  // 실행 완료된 경우에만 존재
}

export interface StopCondition {
  id: string
  type: 'stopLoss' | 'takeProfit' | 'period'
  startDate?: string
  endDate?: string
  criteria?: string  // 손절/익절 기준
  value?: string     // 기준값
  description?: string
}

export interface CreateBacktestData {
  name: string
  memo?: string
  stopConditions: StopCondition[]
}

export interface HoldingSummary {
  name: string
  weight: number
  dailyRate: number
}

export interface PortfolioMainData {
  name: string
  totalValue: number
  holdings: HoldingSummary[]
  dailySum: number
}

export interface AnalysisMetrics {
  downsideStd: number      // 하방 표준편차 (하방 위험)
  sortinoRatio: number     // 소르티노 비율
  expectedReturn: number   // 기대수익률
}

export interface RiskProfile {
  risk_level: string              // 위험도 레벨 (예: "고위험", "중위험", "저위험")
  suitability: string            // 적합한 투자자 유형
  interpretation: string         // 위험 프로필 해석
}

export interface PerformanceInsight {
  risk_interpretation: string     // 위험 해석
  return_interpretation: string   // 수익 해석
  efficiency_interpretation: string // 효율성 해석
}

export interface HoldingItem {
  ticker: string    // 종목 코드
  name: string      // 종목명
  weight: number    // 비중 (백분율, 예: 27.7036)
  value?: number    // 종목 가치
  dailyRate?: number // 일일 수익률
}
  
export interface AnalysisResult {
  type: string  // API에서 다양한 형태로 전달됨 (예: "user", "min_variance", "max_sortino", "내 포트폴리오" 등)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  holdings: Array<{code: string, name: string, weight: number}> | Record<string, number>
  metrics?: AnalysisMetrics        // 분석 메트릭
  key_strengths?: string[]         // 강점
  key_weaknesses?: string[]        // 약점
  risk_profile?: RiskProfile       // 위험 프로필
  performance_insight?: PerformanceInsight // 성과 인사이트
}

export interface ComparativeAnalysis {
  decision_framework: {
    [key: string]: string[]        // 각 포트폴리오를 선택해야 하는 조건들
  }
  key_differentiator: string        // 핵심 차별점
  three_way_comparison: {
    risk_perspective: string        // 위험 관점 비교
    return_perspective: string      // 수익 관점 비교
    efficiency_perspective: string  // 효율성 관점 비교
  }
}

export interface PersonalizedRecommendation {
  final_guidance: string            // 최종 가이드
  risk_tolerance_assessment: {
    low_risk_tolerance: string       // 저위험 성향 투자자 추천
    medium_risk_tolerance: string    // 중위험 성향 투자자 추천
    high_risk_tolerance: string      // 고위험 성향 투자자 추천
  }
  investment_horizon_assessment: {
    short_term: string              // 단기 투자자 추천
    medium_term: string             // 중기 투자자 추천
    long_term: string               // 장기 투자자 추천
  }
}

export interface PortfolioAnalysis {
  status: 'COMPLETED' | 'RUNNING' | 'PENDING' | 'FAILED'
  portfolioName?: string           // 포트폴리오 이름
  holdings?: HoldingItem[]         // 전체 종목 정보 (ticker + name 매핑용)
  results?: AnalysisResult[]       // 분석 결과 배열 (API 응답에서 직접 제공)
  portfolio_insights?: AnalysisResult[]
  analysisDate?: string            // 분석 일시
  analysisPeriod?: {               // 분석 기간
    startDate: string
    endDate: string
  }
  comparative_analysis?: ComparativeAnalysis        // 비교 분석
  personalized_recommendation?: PersonalizedRecommendation // 맞춤 추천
  execution_time?: number          // 분석 실행 시간 (초 단위)
}

export const PORTFOLIO_RISK_LEVEL_LABELS = {
  LOW: '위험도 낮음',
  MEDIUM: '위험도 보통', 
  HIGH: '위험도 높음',
  VERY_HIGH: '위험도 매우 높음'
} as const

export const PORTFOLIO_RISK_LEVEL_COLORS = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  HIGH: 'text-orange-600 bg-orange-50',
  VERY_HIGH: 'text-red-600 bg-red-50'
} as const
