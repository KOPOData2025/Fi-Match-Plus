"use client"

import { motion } from "framer-motion"
import { BarChart3, TrendingUp, TrendingDown, Activity, PieChart } from "lucide-react"

interface PortfolioFilterButtonsProps {
  selectedFilter: string
  onFilterChange: (filter: string) => void
}

const filters = [
  { key: "all", label: "전체", icon: BarChart3 },
  { key: "positive", label: "수익", icon: TrendingUp },
  { key: "negative", label: "손실", icon: TrendingDown },
  { key: "high-risk", label: "고위험", icon: Activity },
  { key: "low-risk", label: "저위험", icon: PieChart },
]

export default function PortfolioFilterButtons({ selectedFilter, onFilterChange }: PortfolioFilterButtonsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-wrap gap-3"
    >
      {filters.map((filter) => (
        <motion.button
          key={filter.key}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(filter.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            selectedFilter === filter.key
              ? "bg-[#009178] text-white"
              : "bg-white/95 text-[#6b7280] hover:bg-[#009178]/10 border border-[#009178]/20"
          }`}
        >
          <filter.icon className="w-4 h-4" />
          {filter.label}
        </motion.button>
      ))}
    </motion.section>
  )
}
