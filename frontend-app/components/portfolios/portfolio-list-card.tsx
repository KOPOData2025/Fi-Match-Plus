"use client"

import { formatCurrency, formatPercent } from "@/utils/formatters"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Portfolio {
  id: string
  name: string
  description: string
  totalValue: number
  changeAmount: number
  changePercent: number
  riskLevel: "낮음" | "보통" | "높음"
  holdings: Array<{
    name: string
    percentage: number
  }>
}

interface PortfolioListCardProps {
  portfolio: Portfolio
  onClick: () => void
  index: number
  isSelected: boolean
}

export function PortfolioListCard({ portfolio, onClick, index, isSelected }: PortfolioListCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "낮음":
        return "bg-green-100 text-green-800"
      case "보통":
        return "bg-yellow-100 text-yellow-800"
      case "높음":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div
      onClick={onClick}
      className={`backdrop-blur-sm rounded-xl p-4 mx-2 shadow-xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] animate-in fade-in duration-500 ${
        isSelected ? "bg-[#009178] text-white ring-4 ring-[#009178]/30" : "bg-white/95 border border-[#009178]"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-xl font-bold mb-1 ${isSelected ? "text-white" : "text-[#1f2937]"}`}>{portfolio.name}</h3>
          <p className={`text-sm ${isSelected ? "text-white/80" : "text-[#6b7280]"}`}>{portfolio.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className={`text-2xl font-bold ${isSelected ? "text-white" : "text-[#1f2937]"}`}>
            {formatCurrency(portfolio.totalValue)}
          </div>
          <div
            className={`flex items-center gap-1 text-lg font-medium ${
              isSelected ? "text-white/90" : portfolio.changePercent >= 0 ? "text-[#008485]" : "text-[#dc2626]"
            }`}
          >
            {portfolio.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {formatPercent(portfolio.changePercent)} ({formatCurrency(portfolio.changeAmount)})
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {portfolio.holdings.slice(0, 3).map((holding, idx) => (
          <span
            key={holding.name}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isSelected ? "bg-white/20 text-white" : "bg-[#f0f9f7] text-[#008485]"
            }`}
          >
            {holding.name}
          </span>
        ))}
        {portfolio.holdings.length > 3 && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isSelected ? "bg-white/10 text-white/70" : "bg-[#f3f4f6] text-[#6b7280]"
            }`}
          >
            +{portfolio.holdings.length - 3}개
          </span>
        )}
      </div>
    </div>
  )
}
