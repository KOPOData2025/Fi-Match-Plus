"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Shield, Target, TrendingUp, Calendar, Clock } from "lucide-react"
import Header from "@/components/header"
import { fetchPortfolioAnalysisDetail } from "@/lib/api/portfolios"
import { useTickerMapping } from "@/contexts/TickerMappingContext"
import { PortfolioPieChart } from "@/components/portfolios/portfolio-pie-chart"
import { RiskEfficiencyChart } from "@/components/portfolios/RiskEfficiencyChart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PORTFOLIO_RISK_LEVEL_LABELS, PORTFOLIO_RISK_LEVEL_COLORS } from "@/types/portfolio"
import type { PortfolioAnalysis, AnalysisResult } from "@/types/portfolio"

interface PortfolioAnalysisDetailClientProps {
  portfolioId: string
}

export function PortfolioAnalysisDetailClient({ portfolioId }: PortfolioAnalysisDetailClientProps) {
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysis | null>(null)
  const [portfolioName, setPortfolioName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendation'>('analysis')
  
  const { getStockName } = useTickerMapping()

  const formatExecutionTime = (seconds?: number): string => {
    if (!seconds) return '-'
    
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`
    } else if (seconds < 60) {
      return `${seconds.toFixed(2)}초`
    } else {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = (seconds % 60).toFixed(0)
      return `${minutes}분 ${remainingSeconds}초`
    }
  }

  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const data = await fetchPortfolioAnalysisDetail(portfolioId)
        
        if (!data) {
          setError("분석 데이터를 불러올 수 없습니다.")
          return
        }
        
        setPortfolioName(data.portfolioName || "포트폴리오 분석")
        
        const resultsData = data.results || data.portfolio_insights || []
        
        setAnalysisData({
          status: data.status,
          portfolioName: data.portfolioName,
          analysisDate: data.analysisDate,
          analysisPeriod: data.analysisPeriod,
          results: resultsData,
          comparative_analysis: data.comparative_analysis,
          personalized_recommendation: data.personalized_recommendation
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "분석 데이터를 불러오는데 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalysis()
  }, [portfolioId])

  const getRiskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const colors = {
      LOW: '#10b981',
      MEDIUM: '#f59e0b',
      HIGH: '#ef4444'
    }
    return colors[level]
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'user':
      case '내 포트폴리오':
        return '사용자 포트폴리오'
      case 'min_variance':
      case 'min_downside_risk':
        return '최소분산 포트폴리오'
      case 'max_sortino':
      case '소르티노 비율 최적화':
        return '소르티노 최적화 포트폴리오'
      default:
        return type
    }
  }

  const getAnalysisTypeShortLabel = (type: string) => {
    switch (type) {
      case 'user':
      case '내 포트폴리오':
        return '내 포트폴리오'
      case 'min_variance':
      case 'min_downside_risk':
        return '최소분산'
      case 'max_sortino':
      case '소르티노 비율 최적화':
        return '소르티노 최적화'
      default:
        return type
    }
  }

  const convertToPieChartData = (result: AnalysisResult) => {
    if (Array.isArray(result.holdings)) {
      return result.holdings.map((holding: any, index: number) => ({
        name: holding.name,
        percent: holding.weight * 100, 
        trend: 0,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
        amount: 0
      }))
    }
    
    if (typeof result.holdings === 'object' && !Array.isArray(result.holdings)) {
      const tickers = Object.keys(result.holdings).sort()
      return tickers.map((ticker, index) => ({
        name: getStockName(ticker, parseInt(portfolioId)),
        percent: (result.holdings as any)[ticker] * 100,
        trend: 0,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
        amount: 0
      }))
    }
    
    return []
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-7xl mx-auto pt-8 px-4 pb-8">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#009178]" />
              <span className="text-lg text-[#1f2937]">분석 결과를 불러오는 중...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-7xl mx-auto pt-8 px-4 pb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#1f2937] mb-2">분석 데이터를 불러올 수 없습니다</h2>
            <p className="text-[#6b7280]">{error || "알 수 없는 오류가 발생했습니다."}</p>
          </div>
        </main>
      </div>
    )
  }

  const scatterData = (analysisData.results || []).map(result => ({
    name: getAnalysisTypeShortLabel(result.type),
    type: result.type,
    riskLevel: result.riskLevel,
    risk: result.metrics?.downsideStd ? result.metrics.downsideStd * 100 : 0,
    sortino: result.metrics?.sortinoRatio ?? 0,
    expectedReturn: result.metrics?.expectedReturn ? result.metrics.expectedReturn * 100 : 0,
    color: getRiskColor(result.riskLevel)
  }))

  const AnalysisTab = () => (
    <div className="space-y-6">
      
      <div className="grid grid-cols-5 gap-6">
        
        <div className="col-span-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
          <h3 className="text-xl font-bold text-[#1f2937] mb-2">포트폴리오 위험-효율성 분석</h3>
          <p className="text-[#6b7280] mb-4 text-sm">하방 위험과 소르티노 비율로 비교한 포지셔닝</p>
          
          <RiskEfficiencyChart data={scatterData} />
          
          <div className="mt-4 flex justify-center gap-6">
            {scatterData.map(d => (
              <div key={d.type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></div>
                <span className="font-medium text-sm text-[#1f2937] whitespace-nowrap">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        
        <div className="col-span-2 space-y-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">핵심 지표 요약</h3>
            <div className="space-y-3">
              {(analysisData.results || []).map((result) => (
                <div key={result.type} className="p-3 rounded-lg border-2 hover:shadow-md transition-all" style={{ borderColor: getRiskColor(result.riskLevel) }}>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="font-semibold text-sm text-[#1f2937] whitespace-nowrap">{getAnalysisTypeShortLabel(result.type)}</span>
                    <Badge className={`text-xs font-medium flex-shrink-0 ${PORTFOLIO_RISK_LEVEL_COLORS[result.riskLevel]}`}>
                      {PORTFOLIO_RISK_LEVEL_LABELS[result.riskLevel]}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-[#6b7280]">기대수익률</p>
                      <p className="font-semibold text-sm text-[#1f2937]">
                        {scatterData.find(d => d.type === result.type)?.expectedReturn.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">하방위험</p>
                      <p className="font-semibold text-sm text-[#1f2937]">
                        {scatterData.find(d => d.type === result.type)?.risk.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">소르티노</p>
                      <p className="font-semibold text-sm" style={{ color: getRiskColor(result.riskLevel) }}>
                        {scatterData.find(d => d.type === result.type)?.sortino.toFixed(3)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-2xl shadow-xl border border-[#009178] p-6">
            <h3 className="text-base font-bold mb-3 text-[#1f2937]">차트 해석 가이드</h3>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">왼쪽 상단:</span> 낮은 하방위험 + 높은 효율성</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">오른쪽 하단:</span> 높은 하방위험 + 낮은 효율성</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">소르티노 비율:</span> 하방위험 대비 수익 효율성</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#009178] font-bold">•</span>
                <span><span className="font-semibold">하방위험:</span> 손실 발생 시 변동성</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      
      {analysisData.comparative_analysis && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
          <div className="flex items-baseline gap-2 mb-6">
            <h3 className="text-xl font-bold text-[#1f2937]">포트폴리오 비교</h3>
            <span className="text-xs text-[#6b7280] bg-gray-100 px-2 py-0.5 rounded">현재 평가액 기준</span>
          </div>
          
          
          <div className="mb-6 p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border border-[#009178]">
            <h4 className="font-semibold text-base text-[#1f2937] mb-2">핵심 차별점</h4>
            <p className="text-sm text-[#374151]">{analysisData.comparative_analysis.key_differentiator}</p>
          </div>

          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">위험 관점</h4>
              <p className="text-xs text-blue-800 leading-relaxed">{analysisData.comparative_analysis.three_way_comparison.risk_perspective}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <h4 className="font-semibold text-sm text-purple-900 mb-2">수익 관점</h4>
              <p className="text-xs text-purple-800 leading-relaxed">{analysisData.comparative_analysis.three_way_comparison.return_perspective}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h4 className="font-semibold text-sm text-amber-900 mb-2">효율성 관점</h4>
              <p className="text-xs text-amber-800 leading-relaxed">{analysisData.comparative_analysis.three_way_comparison.efficiency_perspective}</p>
            </div>
          </div>
        </div>
      )}

      
      <div className="grid grid-cols-3 gap-6">
        {(analysisData.results || []).map((result) => {
          const pieChartData = convertToPieChartData(result)
          const metrics = scatterData.find(d => d.type === result.type)
          
          return (
            <div key={result.type} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-t-4 hover:shadow-2xl transition-all" style={{ borderTopColor: getRiskColor(result.riskLevel) }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#1f2937]">{getAnalysisTypeLabel(result.type)}</h3>
                  <Badge className={`text-xs font-medium border ${PORTFOLIO_RISK_LEVEL_COLORS[result.riskLevel]}`}>
                    {PORTFOLIO_RISK_LEVEL_LABELS[result.riskLevel]}
                  </Badge>
                </div>

                
                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6b7280] font-medium">기대수익률</span>
                    <span className="font-semibold text-base text-[#1f2937]">{metrics?.expectedReturn.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6b7280] font-medium">하방위험</span>
                    <span className="font-semibold text-base text-[#1f2937]">{metrics?.risk.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6b7280] font-medium">소르티노 비율</span>
                    <span className="font-semibold text-base" style={{ color: getRiskColor(result.riskLevel) }}>
                      {metrics?.sortino.toFixed(3)}
                    </span>
                  </div>
                </div>

                
                {result.risk_profile && (
                  <div className="mb-6 p-4 rounded-xl border-2" style={{ borderColor: getRiskColor(result.riskLevel), backgroundColor: `${getRiskColor(result.riskLevel)}10` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4" style={{ color: getRiskColor(result.riskLevel) }} />
                      <h4 className="font-semibold text-sm" style={{ color: getRiskColor(result.riskLevel) }}>
                        {result.risk_profile.risk_level}
                      </h4>
                    </div>
                    <p className="text-xs text-[#374151] mb-2">{result.risk_profile.suitability}</p>
                    <p className="text-xs text-[#6b7280] leading-relaxed">{result.risk_profile.interpretation}</p>
                  </div>
                )}

                
                <div className="space-y-4 mb-6">
                  {(result.key_strengths && result.key_strengths.length > 0) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-500" size={18} />
                        <h4 className="font-semibold text-sm text-[#1f2937]">강점</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {result.key_strengths.map((strength, idx) => (
                          <li key={idx} className="flex gap-2 items-start text-xs text-[#374151]">
                            <span className="text-green-500 font-bold">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(result.key_weaknesses && result.key_weaknesses.length > 0) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-red-500" size={18} />
                        <h4 className="font-semibold text-sm text-[#1f2937]">약점</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {result.key_weaknesses.map((weakness, idx) => (
                          <li key={idx} className="flex gap-2 items-start text-xs text-[#374151]">
                            <span className="text-red-500 font-bold">⚠</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  
                  {(!result.key_strengths || result.key_strengths.length === 0) && (!result.key_weaknesses || result.key_weaknesses.length === 0) && (
                    <div className="text-center text-[#6b7280] py-3">
                      <p className="text-xs">상세 분석 정보가 준비 중입니다.</p>
                    </div>
                  )}
                </div>

                
                {result.performance_insight && (
                  <div className="mb-6 space-y-3">
                    <h4 className="font-semibold text-sm text-[#1f2937] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#009178]" />
                      성과 분석
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium text-blue-900 mb-1">위험</p>
                        <p className="text-xs text-blue-800 leading-relaxed">{result.performance_insight.risk_interpretation}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-medium text-purple-900 mb-1">수익</p>
                        <p className="text-xs text-purple-800 leading-relaxed">{result.performance_insight.return_interpretation}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs font-medium text-amber-900 mb-1">효율성</p>
                        <p className="text-xs text-amber-800 leading-relaxed">{result.performance_insight.efficiency_interpretation}</p>
                      </div>
                    </div>
                  </div>
                )}


                
                <div>
                  <h4 className="font-semibold text-sm text-[#1f2937] mb-3">종목 구성</h4>
                  <div className="flex justify-center mb-3">
                    <PortfolioPieChart 
                      data={pieChartData}
                      height={180}
                    />
                  </div>
                  <div className="space-y-2">
                    {pieChartData.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <span className="font-medium text-[#1f2937]">{item.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: getRiskColor(result.riskLevel) }}>
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const RecommendationTab = () => {
    if (!analysisData.personalized_recommendation) {
      const generateRecommendationsFromResults = () => {
        const results = analysisData.results || []
        const recommendations: Array<{
          title: string
          Icon: any
          bgColor: string
          lightBg: string
          border: string
          textColor: string
          portfolio: string
          desc: string
          features: string[]
          riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
          actualMetrics: any
        }> = []

        results.forEach((result) => {
          const metrics = scatterData.find(d => d.type === result.type)
          if (!metrics) return

          let recommendation: typeof recommendations[0] | null = null

          if (result.riskLevel === 'LOW') {
            recommendation = {
              title: '안정 추구형',
              Icon: Shield,
              bgColor: 'bg-[#10b981]',
              lightBg: 'bg-green-50',
              border: 'border-green-300',
              textColor: 'text-green-800',
              portfolio: getAnalysisTypeLabel(result.type),
              desc: '손실을 최소화하고 안정적인 투자를 원하시나요?',
              features: [
                `하방위험 ${metrics.risk.toFixed(2)}%로 낮은 수준`,
                `기대수익률 ${metrics.expectedReturn.toFixed(2)}%`,
                `소르티노 비율 ${metrics.sortino.toFixed(3)}`,
                '심리적 안정감 제공',
                '단기 투자에 적합'
              ],
              riskLevel: result.riskLevel,
              actualMetrics: metrics
            }
          } else if (result.riskLevel === 'MEDIUM') {
            recommendation = {
              title: '균형 추구형',
              Icon: Target,
              bgColor: 'bg-[#f59e0b]',
              lightBg: 'bg-yellow-50',
              border: 'border-yellow-300',
              textColor: 'text-yellow-800',
              portfolio: getAnalysisTypeLabel(result.type),
              desc: '위험과 수익의 균형을 추구하시나요?',
              features: [
                `적정 하방위험 ${metrics.risk.toFixed(2)}%`,
                `기대수익률 ${metrics.expectedReturn.toFixed(2)}%`,
                `소르티노 비율 ${metrics.sortino.toFixed(3)}`,
                '균형잡힌 리스크 관리',
                '중기 투자에 적합'
              ],
              riskLevel: result.riskLevel,
              actualMetrics: metrics
            }
          } else if (result.riskLevel === 'HIGH') {
            recommendation = {
              title: '수익 추구형',
              Icon: TrendingUp,
              bgColor: 'bg-[#ef4444]',
              lightBg: 'bg-red-50',
              border: 'border-red-300',
              textColor: 'text-red-800',
              portfolio: getAnalysisTypeLabel(result.type),
              desc: '높은 수익을 위해 위험을 감수할 수 있나요?',
              features: [
                `높은 하방위험 ${metrics.risk.toFixed(2)}%`,
                `높은 기대수익률 ${metrics.expectedReturn.toFixed(2)}%`,
                `소르티노 비율 ${metrics.sortino.toFixed(3)}`,
                '적극적 포트폴리오 구성',
                '장기 투자에 적합'
              ],
              riskLevel: result.riskLevel,
              actualMetrics: metrics
            }
          }

          if (recommendation) {
            recommendations.push(recommendation)
          }
        })

        return recommendations
      }

      const dynamicRecommendations = generateRecommendationsFromResults()

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {dynamicRecommendations.map(({ title, Icon, bgColor, lightBg, border, textColor, portfolio, desc, features, riskLevel, actualMetrics }) => (
              <div key={title} className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-t-4 ${border} hover:shadow-2xl transition-all`}>
                <div className={`${bgColor} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                  <Icon className="text-white" size={24} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-[#1f2937]">{title}</h3>
                  <Badge className={`text-xs font-medium ${PORTFOLIO_RISK_LEVEL_COLORS[riskLevel]}`}>
                    {PORTFOLIO_RISK_LEVEL_LABELS[riskLevel]}
                  </Badge>
                </div>
                <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">{desc}</p>
                <div className={`${lightBg} p-4 rounded-xl mb-4 border ${border}`}>
                  <p className={`font-semibold text-sm ${textColor}`}>→ {portfolio}</p>
                </div>
                <ul className="text-sm space-y-2 text-[#374151]">
                  {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`${bgColor} text-white font-semibold text-xs px-1.5 py-0.5 rounded mt-0.5`}>{i + 1}</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )
    }

    const recommendation = analysisData.personalized_recommendation

    return (
      <div className="space-y-6">
        
        <div className="bg-gradient-to-br from-[#009178] to-[#004e42] rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Target className="w-6 h-6" />
            투자 가이드
          </h3>
          <p className="text-sm leading-relaxed opacity-95">{recommendation.final_guidance}</p>
        </div>

        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
          <h3 className="text-lg font-bold text-[#1f2937] mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#009178]" />
            위험 성향별 맞춤 추천
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-300 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <Shield className="text-white" size={20} />
                </div>
                <h4 className="font-bold text-base text-green-900">저위험 성향</h4>
              </div>
              <p className="text-sm text-green-800 leading-relaxed">{recommendation.risk_tolerance_assessment.low_risk_tolerance}</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-yellow-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <Target className="text-white" size={20} />
                </div>
                <h4 className="font-bold text-base text-yellow-900">중위험 성향</h4>
              </div>
              <p className="text-sm text-yellow-800 leading-relaxed">{recommendation.risk_tolerance_assessment.medium_risk_tolerance}</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-300 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <h4 className="font-bold text-base text-red-900">고위험 성향</h4>
              </div>
              <p className="text-sm text-red-800 leading-relaxed">{recommendation.risk_tolerance_assessment.high_risk_tolerance}</p>
            </div>
          </div>
        </div>

        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
          <h3 className="text-lg font-bold text-[#1f2937] mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#009178]" />
            투자 기간별 맞춤 추천
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border-l-4 border-[#009178] hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#009178] text-white text-xs font-bold px-2 py-1 rounded">단기</div>
                <h4 className="font-semibold text-sm text-[#1f2937]">1년 미만</h4>
              </div>
              <p className="text-sm text-[#374151] leading-relaxed">{recommendation.investment_horizon_assessment.short_term}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border-l-4 border-[#009178] hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#009178] text-white text-xs font-bold px-2 py-1 rounded">중기</div>
                <h4 className="font-semibold text-sm text-[#1f2937]">1-3년</h4>
              </div>
              <p className="text-sm text-[#374151] leading-relaxed">{recommendation.investment_horizon_assessment.medium_term}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-[#d1f0eb] to-[#e8f5f3] rounded-xl border-l-4 border-[#009178] hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#009178] text-white text-xs font-bold px-2 py-1 rounded">장기</div>
                <h4 className="font-semibold text-sm text-[#1f2937]">3년 이상</h4>
              </div>
              <p className="text-sm text-[#374151] leading-relaxed">{recommendation.investment_horizon_assessment.long_term}</p>
            </div>
          </div>
        </div>

        
        {analysisData.comparative_analysis && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6">
            <h3 className="text-lg font-bold text-[#1f2937] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#009178]" />
              나에게 맞는 포트폴리오 찾기
            </h3>
            <p className="text-sm text-[#6b7280] mb-6">각 포트폴리오는 다음과 같은 경우에 적합합니다</p>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(analysisData.comparative_analysis.decision_framework).map(([key, conditions]) => {
                const portfolioName = key.replace('choose_', '').replace('_if', '').replace(/_/g, ' ')
                const displayInfo = 
                  portfolioName.includes('user') ? 
                    { name: '사용자 포트폴리오', icon: TrendingUp, iconBg: 'bg-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-900' } :
                  portfolioName.includes('min') || portfolioName.includes('downside') ? 
                    { name: '최소 하방위험', icon: Shield, iconBg: 'bg-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-900' } :
                    { name: '소르티노 최적화', icon: Target, iconBg: 'bg-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-900' }
                
                const IconComponent = displayInfo.icon
                
                const conditionsList = Array.isArray(conditions) ? conditions : []
                
                return (
                  <div key={key} className={`p-4 ${displayInfo.bgColor} rounded-xl border-2 ${displayInfo.borderColor} hover:shadow-lg transition-all`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`${displayInfo.iconBg} w-10 h-10 rounded-full flex items-center justify-center`}>
                        <IconComponent className="text-white" size={20} />
                      </div>
                      <h4 className={`font-bold text-sm ${displayInfo.textColor}`}>{displayInfo.name}</h4>
                    </div>
                    <ul className="space-y-2">
                      {conditionsList.map((condition: string, idx: number) => (
                        <li key={idx} className={`text-xs ${displayInfo.textColor} opacity-90 flex gap-2 items-start`}>
                          <span className="font-bold mt-0.5">✓</span>
                          <span>{condition}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      
      <main className="max-w-7xl mx-auto pt-6 px-4 pb-8">
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              {(portfolioName || analysisData.portfolioName) && (
                <h1 className="text-2xl font-bold text-[#1f2937] mb-1">
                  {portfolioName || analysisData.portfolioName}
                </h1>
              )}
              <p className="text-base text-[#6b7280]">KOSPI 벤치마크 기준 | 3년 롤링 윈도우 최적화 분석</p>
            </div>
            <div className="text-right space-y-3">
              {analysisData.analysisPeriod && (
                <div>
                  <p className="text-sm text-[#6b7280]">분석 기간</p>
                  <p className="text-base font-semibold text-[#1f2937]">
                    {analysisData.analysisPeriod.startDate} ~ {analysisData.analysisPeriod.endDate}
                  </p>
                </div>
              )}
              {analysisData.execution_time !== undefined && (
                <div className="flex items-center justify-end gap-2">
                  <Clock className="w-4 h-4 text-[#009178]" />
                  <div>
                    <span className="text-sm text-[#6b7280]">분석 시간: </span>
                    <span className="text-sm font-semibold text-[#009178]">
                      {formatExecutionTime(analysisData.execution_time)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          
          <div className="bg-gradient-to-br from-[#009178] to-[#006d5b] rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2">투자성향 진단</h2>
                <p className="text-sm leading-relaxed opacity-95 mb-3">
                  과학적 분석을 통해 실제 자산 구성을 바탕으로 귀하의 투자 성향을 객관적으로 진단합니다.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>하방위험 기반 분석</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>소르티노 비율 최적화</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>개인 맞춤형 추천</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-1.5">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-6 py-3 font-semibold text-base rounded-lg transition-all ${activeTab === 'analysis' ? 'bg-[#009178] text-white shadow-md' : 'text-[#6b7280] hover:bg-[#f0f9f7]'}`}
          >
            포트폴리오 분석
          </button>
          <button
            onClick={() => setActiveTab('recommendation')}
            className={`flex-1 px-6 py-3 font-semibold text-base rounded-lg transition-all ${activeTab === 'recommendation' ? 'bg-[#009178] text-white shadow-md' : 'text-[#6b7280] hover:bg-[#f0f9f7]'}`}
          >
            맞춤 추천
          </button>
        </div>

        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'recommendation' && <RecommendationTab />}
      </main>
    </div>
  )
}

