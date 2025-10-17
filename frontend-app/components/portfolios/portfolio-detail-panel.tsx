"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import { PortfolioDetailHeader } from "./portfolio-detail-header"
import { PortfolioTabContent } from "./portfolio-tab-content"
import { useAnalysisCache } from "@/contexts/AnalysisCacheContext"

interface PortfolioDetailPanelProps {
  portfolio: PortfolioWithDetails
  onPortfolioDeleted?: () => void
}

type TabType = "holdings" | "backtests" | "analysis"

export function PortfolioDetailPanel({ portfolio, onPortfolioDeleted }: PortfolioDetailPanelProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setAnalysisData } = useAnalysisCache()
  
  const activeTab = (searchParams.get('tab') as TabType) || "holdings"

  useEffect(() => {
    if (portfolio.analysis !== undefined) {
      setAnalysisData(portfolio.id, portfolio.analysis)
    }
  }, [portfolio.id, portfolio.analysis, setAnalysisData])

  const handleTabChange = (tabId: TabType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#009178] p-6 animate-in fade-in duration-500 flex flex-col h-full overflow-hidden">
      <PortfolioDetailHeader 
        portfolio={portfolio} 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onPortfolioDeleted={onPortfolioDeleted}
      />
      <div className="flex-1 overflow-y-auto min-h-0">
        <PortfolioTabContent 
          portfolio={portfolio} 
          activeTab={activeTab} 
        />
      </div>
    </div>
  )
}
