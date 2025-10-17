"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Target, Loader2, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react"
import { fetchPortfolioAnalysis, fetchAnalysisStatus } from "@/lib/api/portfolios"
import { useTickerMapping } from "@/contexts/TickerMappingContext"
import { useAnalysisCache } from "@/contexts/AnalysisCacheContext"
import { AnalysisPieChart } from "./AnalysisPieChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PORTFOLIO_RISK_LEVEL_LABELS, PORTFOLIO_RISK_LEVEL_COLORS } from "@/types/portfolio"
import type { PortfolioAnalysis, AnalysisResult } from "@/types/portfolio"

interface PortfolioAnalysisTabProps {
  portfolioId: number
  holdings: Array<{
    ticker: string
    name: string
    weight: number
    value: number
    dailyRate: number
  }>
}

export function PortfolioAnalysisTab({ portfolioId, holdings }: PortfolioAnalysisTabProps) {
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { updatePortfolioMappings, getStockName } = useTickerMapping()
  const { getAnalysisData, setAnalysisData: cacheAnalysisData } = useAnalysisCache()

  useEffect(() => {
    const mappings: Record<string, string> = {}
    holdings.forEach(holding => {
      mappings[holding.ticker] = holding.name
    })
    updatePortfolioMappings(portfolioId, mappings)
  }, [holdings, portfolioId, updatePortfolioMappings])

  const loadAnalysisData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const cachedData = getAnalysisData(portfolioId)
      
      if (cachedData !== undefined) {
        setAnalysisData(cachedData)
        setIsLoading(false)
        return
      }
      
      const data = await fetchPortfolioAnalysis(portfolioId.toString())
      
      cacheAnalysisData(portfolioId, data)
      
      setAnalysisData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 데이터를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [portfolioId, getAnalysisData, cacheAnalysisData])

  const handleRetry = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await fetchPortfolioAnalysis(portfolioId.toString())
      
      cacheAnalysisData(portfolioId, data)
      
      setAnalysisData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 데이터를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [portfolioId, cacheAnalysisData])

  useEffect(() => {
    loadAnalysisData()
  }, [portfolioId])

  useEffect(() => {
    if (!analysisData || (analysisData.status !== 'RUNNING' && analysisData.status !== 'PENDING')) {
      return
    }

    const pollInterval = setInterval(async () => {
      const statusData = await fetchAnalysisStatus(portfolioId.toString())
      
      if (!statusData) {
        return
      }

      if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
        await handleRetry()
      }
    }, 30000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [portfolioId, analysisData?.status, handleRetry])

  const convertToPieChartData = (result: AnalysisResult) => {
    if (Array.isArray(result.holdings)) {
      return result.holdings.map((holding: any, index: number) => ({
        name: holding.name,
        value: holding.weight * 100,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      }))
    }
    
    if (typeof result.holdings === 'object' && !Array.isArray(result.holdings)) {
      const colorMap: Record<string, string> = {}
      const nameMap: Record<string, string> = {}
      
      holdings.forEach((h, idx) => {
        colorMap[h.ticker] = `hsl(${(idx * 137.5) % 360}, 70%, 50%)`
        nameMap[h.ticker] = h.name
      })

      const tickers = Object.keys(result.holdings).sort()
      return tickers.map((ticker, index) => ({
        name: nameMap[ticker] || getStockName(ticker, portfolioId),
        value: (result.holdings as any)[ticker] * 100,
        color: colorMap[ticker] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      }))
    }
    
    return []
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case '내 포트폴리오':
        return '사용자 지정'
      case '하방위험 최소화':
      case 'min_variance':
      case 'min-downside-risk':
      case 'min_downside_risk':
        return '안정형'
      case '소르티노 비율 최적화':
      case 'max_sortino':
      case 'max-sharpe':
        return '공격형'
      default:
        return type
    }
  }


  if (isLoading && !analysisData) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#009178]" />
          <span className="ml-2 text-[#6b7280]">분석 결과를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <div className="text-lg text-red-600 mb-4">분석 데이터를 불러올 수 없습니다</div>
          <p className="text-[#6b7280] mb-6">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-lg text-[#6b7280]">분석 데이터가 없습니다</div>
        </div>
      </div>
    )
  }

  if (analysisData.status === 'FAILED') {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1f2937] mb-2">분석 실패</h3>
          <p className="text-[#6b7280] mb-6">분석 중 오류가 발생했습니다.</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (analysisData.status === 'RUNNING' || analysisData.status === 'PENDING') {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#009178] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1f2937] mb-2">분석 진행 중</h3>
          <p className="text-[#6b7280]">상세 분석이 진행 중입니다. 잠시만 기다려주세요.</p>
          <p className="text-sm text-[#9ca3af] mt-2">완료되면 자동으로 결과가 표시됩니다</p>
        </div>
      </div>
    )
  }

  const results = analysisData.results || analysisData.portfolio_insights || []
  
  if (analysisData.status === 'COMPLETED' && results.length > 0) {
    return (
      <div className="bg-[#f0f9f7] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#009178]" />
          <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
        </div>
        
        
        <div className="grid grid-cols-3 gap-6 mb-6">
          {results.map((result, index) => {
            const pieChartData = convertToPieChartData(result)
            
            return (
              <div key={result.type} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-[#1f2937] mb-2">
                    {getAnalysisTypeLabel(result.type)}
                  </h4>
                  <Badge 
                    className={`text-sm font-medium px-3 py-1 ${PORTFOLIO_RISK_LEVEL_COLORS[result.riskLevel]}`}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {PORTFOLIO_RISK_LEVEL_LABELS[result.riskLevel]}
                  </Badge>
                </div>
                
                <div className="flex justify-center mb-4">
                  <AnalysisPieChart 
                    data={pieChartData} 
                    width={180} 
                    height={180} 
                  />
                </div>
                
                
                <div className="space-y-2">
                  {pieChartData.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-[#1f2937] truncate">{item.name}</span>
                      </div>
                      <span className="text-[#6b7280] font-medium">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        
        
        <div className="text-center">
          <Link href={`/portfolios/analysis/${portfolioId}`}>
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <ExternalLink className="w-4 h-4 mr-2" />
              결과 더보기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f0f9f7] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-[#009178]" />
        <h3 className="text-lg font-semibold text-[#1f2937]">상세 분석</h3>
      </div>
      <div className="text-center py-12">
        <div className="text-lg text-[#6b7280]">분석 결과가 없습니다</div>
      </div>
    </div>
  )
}
