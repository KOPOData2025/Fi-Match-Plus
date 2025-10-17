"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ProductListCard as ProductListCardType } from "@/types/product"
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from "@/types/product"
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react"
import { formatPercent } from "@/utils/formatters"

interface ProductListCardProps {
  product: ProductListCardType
}

export function ProductListCard({ product }: ProductListCardProps) {
  const isPositive = product.oneYearReturn >= 0

  return (
    <motion.div
      whileHover={{ x: 4, backgroundColor: "#f9fafb" }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/products/${product.id}`}>
        <div className="group cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 py-5 px-6">
          <div className="flex items-center justify-between">
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-[#006b6c] transition-colors">
                  {product.name}
                </h3>
                <Badge 
                  className={`text-sm font-medium px-3 py-1 ${RISK_LEVEL_COLORS[product.riskLevel]}`}
                >
                  {RISK_LEVEL_LABELS[product.riskLevel]}
                </Badge>
              </div>
              
              
              <div className="flex flex-wrap gap-2">
                {product.keywords.map((keyword, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            
            <div className="flex items-center gap-6">
              
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">1년 수익률</div>
                <div className={`flex items-center gap-1 text-lg font-semibold ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatPercent(product.oneYearReturn)}
                </div>
              </div>

              
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">최소 투자</div>
                <div className="text-base font-semibold text-gray-900">
                  {(product.minInvestment / 10000).toFixed(0)}만원
                </div>
              </div>

              
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#006b6c] transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
