"use client"

import { motion } from "framer-motion"
import { DollarSign, Activity, TrendingUp } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/utils"

interface PortfolioSummaryCardProps {
  totalValue: number
  totalChange: number
  totalChangePercent: number
}

export default function PortfolioSummaryCard({
  totalValue,
  totalChange,
  totalChangePercent,
}: PortfolioSummaryCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#009178]"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-[#009178]" />
            <span className="text-[#6b7280] text-lg font-medium">총 자산</span>
          </div>
          <div className="text-4xl font-bold text-[#1f2937]">{formatCurrency(totalValue)}</div>
        </div>
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-[#009178]" />
            <span className="text-[#6b7280] text-lg font-medium">오늘 수익률</span>
          </div>
          <div className={`text-3xl font-bold ${totalChange > 0 ? "text-[#dc2626]" : "text-[#009178]"}`}>
            {formatPercent(totalChangePercent)}
          </div>
        </div>
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-[#009178]" />
            <span className="text-[#6b7280] text-lg font-medium">오늘 수익금</span>
          </div>
          <div className={`text-3xl font-bold ${totalChange > 0 ? "text-[#dc2626]" : "text-[#009178]"}`}>
            {totalChange > 0 ? "+" : ""}
            {formatCurrency(totalChange)}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
