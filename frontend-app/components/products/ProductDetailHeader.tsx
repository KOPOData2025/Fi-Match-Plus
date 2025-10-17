"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from "@/types/product"
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

interface ProductDetailHeaderProps {
  product: {
    name: string
    description: string
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    volatilityIndex: number
    oneYearReturn: number
    mdd: number
    sharpeRatio: number
    keywords: string[]
  }
}

export function ProductDetailHeader({ product }: ProductDetailHeaderProps) {
  const isPositive = product.oneYearReturn >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 shadow-lg max-w-6xl mx-auto">
        <CardContent className="p-8">
          <div className="space-y-6">
            
            <div className="flex items-center justify-between gap-6">
              <h1 className="text-3xl font-bold text-gray-900 flex-1">
                {product.name}
              </h1>
              <Badge 
                className={`text-sm font-medium px-4 py-2 ${RISK_LEVEL_COLORS[product.riskLevel as keyof typeof RISK_LEVEL_COLORS]} flex-shrink-0`}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                {RISK_LEVEL_LABELS[product.riskLevel as keyof typeof RISK_LEVEL_LABELS]}
              </Badge>
            </div>

            
            <p className="text-gray-700 text-lg leading-relaxed">
              {product.description}
            </p>

            
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {product.volatilityIndex.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">변동성 지수</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold mb-1 flex items-center justify-center gap-1 ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {isPositive ? '+' : ''}{product.oneYearReturn.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">1년 수익률</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {product.mdd.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">MDD</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {product.sharpeRatio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">샤프지수</div>
              </div>
            </div>

            
            <div className="flex flex-wrap gap-2">
              {product.keywords.map((keyword: string, index: number) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
