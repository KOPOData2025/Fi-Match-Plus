"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Shield, Target } from "lucide-react"

interface ProductDetailMetricsProps {
  product: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    volatilityIndex: number
    oneYearReturn: number
    mdd: number
    sharpeRatio: number
  }
}

export function ProductDetailMetrics({ product }: ProductDetailMetricsProps) {
  const metrics = [
    {
      title: "변동성 지수",
      value: `${product.volatilityIndex.toFixed(1)}%`,
      description: "가격 변동의 정도를 나타내는 지수",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "1년 수익률",
      value: `${product.oneYearReturn >= 0 ? '+' : ''}${product.oneYearReturn.toFixed(1)}%`,
      description: "최근 1년간의 수익률",
      icon: product.oneYearReturn >= 0 ? TrendingUp : TrendingDown,
      color: product.oneYearReturn >= 0 ? "text-green-600" : "text-red-600",
      bgColor: product.oneYearReturn >= 0 ? "bg-green-50" : "bg-red-50"
    },
    {
      title: "MDD (최대 낙폭)",
      value: `${product.mdd.toFixed(1)}%`,
      description: "최고점 대비 최대 하락폭",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "샤프지수",
      value: product.sharpeRatio.toFixed(2),
      description: "위험 대비 수익률의 효율성",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return '안정적인 투자 상품으로 변동성이 낮고 안전합니다.'
      case 'MEDIUM':
        return '적당한 위험과 수익을 추구하는 균형형 상품입니다.'
      case 'HIGH':
        return '높은 수익을 추구하지만 변동성이 큰 상품입니다.'
      case 'VERY_HIGH':
        return '매우 높은 위험과 수익을 추구하는 공격적 상품입니다.'
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="space-y-6"
    >
      
      <Card className="border-0 shadow-lg max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            위험도 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-lg font-medium text-gray-700">
              {product.riskLevel === 'LOW' && '낮음'}
              {product.riskLevel === 'MEDIUM' && '보통'}
              {product.riskLevel === 'HIGH' && '높음'}
              {product.riskLevel === 'VERY_HIGH' && '매우 높음'}
            </div>
            <p className="text-gray-600 leading-relaxed">
              {getRiskDescription(product.riskLevel)}
            </p>
          </div>
        </CardContent>
      </Card>

      
      <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <IconComponent className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {metric.title}
                      </h3>
                      <div className={`text-2xl font-bold mb-2 ${metric.color}`}>
                        {metric.value}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
