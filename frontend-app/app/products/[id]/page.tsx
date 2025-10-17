"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PageLayout } from "@/components/layout/PageLayout"
import { 
  ProductDetailHeader, 
  ProductHistoryChart, 
  ProductDetailMetrics,
  PortfolioHoldings
} from "@/components/products"
import { AuthGuard } from "@/components/AuthGuard"
import { fetchProductDetail } from "@/lib/api/products"
import { fetchMultiStockPrices } from "@/lib/api"
import { PortfolioHolding } from "@/types/product"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy } from "lucide-react"

interface ProductDetailData {
  id: number
  name: string
  description: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  volatilityIndex: number
  oneYearReturn: number
  mdd: number
  sharpeRatio: number
  keywords: string[]
  minInvestment: number
  holdings: {
    symbol: string
    name: string
    weight: number
    sector: string
  }[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<ProductDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveHoldings, setLiveHoldings] = useState<PortfolioHolding[]>([])
  const [isLoadingLive, setIsLoadingLive] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const productId = parseInt(params.id as string)
        
        if (isNaN(productId)) {
          setError('잘못된 상품 ID입니다.')
          setIsLoading(false)
          return
        }

        const data = await fetchProductDetail(productId)
        setProduct(data)
        
        setLiveHoldings(data.holdings.map(h => ({
          ...h,
          price: 0,
          change: 0,
          changePercent: 0
        })))
      } catch (err) {
        console.error('상품 로드 실패:', err)
        setError('상품 정보를 불러오는데 실패했습니다.')
        setProduct(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [params.id])

  useEffect(() => {
    const fetchLiveData = async () => {
      if (!product) return
      
      try {
        setIsLoadingLive(true)
        const codes = product.holdings.map(h => h.symbol)
        const liveData = await fetchMultiStockPrices(codes)
        
        const enriched: PortfolioHolding[] = product.holdings.map(holding => {
          const liveStock = liveData.find(stock => stock.ticker === holding.symbol)
          if (liveStock) {
            return {
              ...holding,
              price: liveStock.currentPrice,
              changePercent: liveStock.dailyRate,
              change: liveStock.dailyChange
            }
          }
          return {
            ...holding,
            price: 0,
            change: 0,
            changePercent: 0
          }
        })
        
        setLiveHoldings(enriched)
      } catch (err) {
        console.error("실시간 데이터 조회 실패:", err)
        setLiveHoldings(product.holdings.map(h => ({
          ...h,
          price: 0,
          change: 0,
          changePercent: 0
        })))
      } finally {
        setIsLoadingLive(false)
      }
    }

    fetchLiveData()
  }, [product])

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  if (error || (!isLoading && !product)) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">{error || '요청하신 상품이 존재하지 않거나 삭제되었습니다.'}</p>
          <Button 
            onClick={() => router.push('/products')}
            className="bg-[#009178] hover:bg-[#004e42]"
          >
            상품 목록으로 돌아가기
          </Button>
        </div>
      </PageLayout>
    )
  }

  if (!product) return null

  return (
    <AuthGuard>
      <PageLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
        >
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 max-w-6xl mx-auto flex justify-between items-center"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-base px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
          
          <Button
            onClick={() => {
              if (product) {
                const portfolioData = {
                  name: `${product.name} - 커스텀`,
                  description: product.description,
                  holdings: liveHoldings.map(holding => ({
                    symbol: holding.symbol,
                    name: holding.name,
                    weight: holding.weight,
                    price: holding.price,
                    change: holding.change,
                    changePercent: holding.changePercent,
                    sector: holding.sector
                  }))
                }
                
                const queryParams = new URLSearchParams({
                  template: 'true',
                  data: JSON.stringify(portfolioData)
                })
                
                router.push(`/portfolios/create?${queryParams.toString()}`)
              }
            }}
            className="bg-[#009178] hover:bg-[#004e42] text-white px-6 py-2"
          >
            <Copy className="w-4 h-4 mr-2" />
            이 구성으로 포트폴리오 만들기
          </Button>
        </motion.div>

        
        <ProductDetailHeader product={product} />

        
        <div className="mt-10">
          <ProductDetailMetrics product={product} />
        </div>

        
        <div className="mt-10">
          <PortfolioHoldings holdings={liveHoldings} />
        </div>
      </motion.div>
      </PageLayout>
    </AuthGuard>
  )
}
