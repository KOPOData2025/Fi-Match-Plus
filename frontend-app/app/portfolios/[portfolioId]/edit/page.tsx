"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { X, Plus, ArrowLeft, Pencil } from "lucide-react"
import { CreatePortfolioData, StockHolding, Rule } from "@/types/portfolio"
import { StockSearch } from "@/components/stocks/StockSearch"
import FloatingChatbot from "@/components/ui/FloatingChatbot"
import type { Stock } from "@/types/stock"
import { updatePortfolio, fetchPortfolioDetail } from "@/lib/api/portfolios"
import { fetchCurrentPriceByCode } from "@/lib/api/stockNow"

function EditPortfolioContent() {
  const router = useRouter()
  const params = useParams()
  const portfolioId = params.portfolioId as string
  
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<CreatePortfolioData>({
    name: "",
    totalValue: 0,
    description: "",
    stockHoldings: [],
    rule: {
      memo: "",
      rebalance: [],
      stopLoss: [],
      takeProfit: []
    }
  })

  const [newStock, setNewStock] = useState<Partial<StockHolding>>({
    symbol: "",
    name: "",
    shares: undefined,
    currentPrice: undefined,
    totalValue: undefined,
    change: undefined,
    changePercent: undefined,
    weight: undefined
  })

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadPortfolioData = async () => {
      setLoading(true)
      try {
        const data = await fetchPortfolioDetail(portfolioId)
        
        if (!data) {
          alert("포트폴리오를 찾을 수 없습니다.")
          router.push("/portfolios")
          return
        }

        const stockHoldings: StockHolding[] = data.holdings.map((holding: any) => ({
          symbol: holding.ticker,
          name: holding.name,
          shares: Math.round(holding.value / holding.dailyRate), 
          currentPrice: holding.dailyRate,
          totalValue: holding.value,
          change: 0,
          changePercent: holding.dailyRate,
          weight: holding.weight
        }))

        const totalValue = stockHoldings.reduce((sum, holding) => sum + holding.totalValue, 0)

        const rule: Rule = {
          memo: data.rules?.memo || "",
          rebalance: data.rules?.rebalance || [],
          stopLoss: data.rules?.stopLoss || [],
          takeProfit: data.rules?.takeProfit || []
        }

        setFormData({
          name: data.name, 
          totalValue: totalValue,
          description: data.description, 
          stockHoldings: stockHoldings,
          rule: rule
        })
        
      } catch (error) {
        console.error("포트폴리오 데이터 로드 실패:", error)
        alert("포트폴리오 데이터를 불러오는데 실패했습니다.")
        router.push("/portfolios")
      } finally {
        setLoading(false)
      }
    }

    if (portfolioId) {
      loadPortfolioData()
    }
  }, [portfolioId, router])

  const handleInputChange = (field: keyof CreatePortfolioData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStockInputChange = (field: keyof StockHolding, value: any) => {
    setNewStock(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStockSelect = async (stock: Stock) => {
    setSelectedStock(stock)
    setNewStock(prev => ({
      ...prev,
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.price,
      change: 0,
      changePercent: stock.changePercent,
      shares: undefined,
      totalValue: undefined,
      weight: undefined
    }))

    const now = await fetchCurrentPriceByCode(stock.symbol)
    if (now) {
      setSelectedStock(prev => prev ? { ...prev, price: now.price, changePercent: now.changePercent } : prev)
      setNewStock(prev => ({
        ...prev,
        currentPrice: now.price,
        changePercent: now.changePercent,
      }))
    }
  }

  const handleSharesChange = (shares: number) => {
    if (selectedStock) {
      const validShares = Math.max(0, shares)
      const totalValue = validShares * selectedStock.price
      
      const existingPortfolioValue = formData.stockHoldings.reduce((sum, holding) => sum + holding.totalValue, 0)
      const totalPortfolioValue = existingPortfolioValue + totalValue
      const weight = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0
      
      setNewStock(prev => ({
        ...prev,
        shares: validShares,
        totalValue,
        weight
      }))
    }
  }

  const handleSharesBlur = () => {
    if (selectedStock && newStock.shares) {
      handleSharesChange(newStock.shares)
    }
  }

  const addStock = () => {
    if (selectedStock && newStock.shares && newStock.shares > 0) {
      const stock: StockHolding = {
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        shares: newStock.shares!,
        currentPrice: selectedStock.price,
        totalValue: newStock.totalValue!,
        change: 0,
        changePercent: selectedStock.changePercent,
        weight: 0
      }
      
      setFormData(prev => {
        const newHoldings = [...prev.stockHoldings, stock]
        const newTotalValue = newHoldings.reduce((sum, s) => sum + s.totalValue, 0)
        
        const updatedHoldings = newHoldings.map(s => ({
          ...s,
          weight: newTotalValue > 0 ? (s.totalValue / newTotalValue) * 100 : 0
        }))
        
        return {
          ...prev,
          stockHoldings: updatedHoldings,
          totalValue: newTotalValue
        }
      })
      
      setSelectedStock(null)
      setNewStock({
        symbol: "",
        name: "",
        shares: undefined,
        currentPrice: undefined,
        totalValue: undefined,
        change: undefined,
        changePercent: undefined,
        weight: undefined
      })
    }
  }

  const calculateTotalValue = () => {
    return formData.stockHoldings.reduce((sum, stock) => sum + stock.totalValue, 0)
  }

  const removeStock = (index: number) => {
    setFormData(prev => {
      const newHoldings = prev.stockHoldings.filter((_, i) => i !== index)
      const newTotalValue = newHoldings.reduce((sum, s) => sum + s.totalValue, 0)
      
      const updatedHoldings = newHoldings.map(s => ({
        ...s,
        weight: newTotalValue > 0 ? (s.totalValue / newTotalValue) * 100 : 0
      }))
      
      return {
        ...prev,
        stockHoldings: updatedHoldings,
        totalValue: newTotalValue
      }
    })
  }

  const editStock = (index: number) => {
    setFormData(prev => {
      const target = prev.stockHoldings[index]
      if (!target) return prev

      const remaining = prev.stockHoldings.filter((_, i) => i !== index)
      const newTotalValue = remaining.reduce((sum, s) => sum + s.totalValue, 0)
      const updatedHoldings = remaining.map(s => ({
        ...s,
        weight: newTotalValue > 0 ? (s.totalValue / newTotalValue) * 100 : 0
      }))

      setSelectedStock({
        symbol: target.symbol,
        name: target.name,
        price: target.currentPrice,
        change: target.change ?? 0,
        changePercent: target.changePercent ?? 0,
        volume: 0,
        marketCap: 0,
        sector: "",
      })
      setNewStock({
        symbol: target.symbol,
        name: target.name,
        shares: target.shares,
        currentPrice: target.currentPrice,
        totalValue: target.totalValue,
        change: target.change ?? 0,
        changePercent: target.changePercent ?? 0,
        weight: undefined,
      })

      return {
        ...prev,
        stockHoldings: updatedHoldings,
        totalValue: newTotalValue,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert("포트폴리오 이름을 입력해주세요.")
      return
    }
    
    if (formData.stockHoldings.length === 0) {
      alert("최소 하나의 종목을 추가해주세요.")
      return
    }

    const invalidHoldings = formData.stockHoldings.filter(h => {
      const hasSymbol = typeof h.symbol === 'string' && h.symbol.trim().length > 0
      const validShares = typeof h.shares === 'number' && isFinite(h.shares) && h.shares > 0
      const validPrice = typeof h.currentPrice === 'number' && isFinite(h.currentPrice) && h.currentPrice > 0
      const validTotal = typeof h.totalValue === 'number' && isFinite(h.totalValue) && h.totalValue > 0
      return !hasSymbol || !validShares || !validPrice || !validTotal
    })
    if (invalidHoldings.length > 0) {
      console.error('[EditPortfolio] 유효하지 않은 보유 종목 감지:', invalidHoldings)
      alert('종목 데이터가 올바르지 않습니다. 수량/현재가/평가금액을 확인하세요.')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const result = await updatePortfolio(Number(portfolioId), formData)
      alert("포트폴리오가 성공적으로 수정되었습니다!")
      router.push("/portfolios")
    } catch (error: unknown) {
      console.error("포트폴리오 수정 실패:", error)
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      alert(`포트폴리오 수정에 실패했습니다: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#009178] border-r-transparent"></div>
          <p className="mt-4 text-[#1f2937]">포트폴리오 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-8 px-4 pb-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-[#1f2937] hover:text-[#009178]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-3xl font-bold text-[#1f2937]">포트폴리오 수정</h1>
          <p className="text-[#6b7280] mt-2">포트폴리오의 정보와 전략을 수정하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">포트폴리오 이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="포트폴리오 이름을 입력하세요"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="포트폴리오에 대한 설명이나 목표를 입력해주세요"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">보유 종목</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="p-4 bg-[#f8fafc] rounded-lg space-y-4">
                <div>
                  <Label className="text-base font-medium">종목 검색</Label>
                  <StockSearch
                    onSelectStock={handleStockSelect}
                    className="mt-2"
                    showPriceChange={false}
                  />
                  {selectedStock && (
                    <div className="mt-2 p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{selectedStock.name} ({selectedStock.symbol})</div>
                          <div className="text-sm text-[#6b7280]">
                            현재가: {selectedStock.price.toLocaleString()}원
                            <span className={`ml-2 ${selectedStock.changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStock(null)
                            setNewStock({
                              symbol: "",
                              name: "",
                              shares: undefined,
                              currentPrice: undefined,
                              totalValue: undefined,
                              change: undefined,
                              changePercent: undefined,
                              weight: undefined
                            })
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {selectedStock && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockShares">보유수량 (주)</Label>
                      <Input
                        id="stockShares"
                        type="number"
                        min="0"
                        value={newStock.shares || ''}
                        onChange={(e) => setNewStock(prev => ({ ...prev, shares: Number(e.target.value) || 0 }))}
                        onBlur={handleSharesBlur}
                        placeholder="보유할 주식 수량을 입력하세요"
                      />
                    </div>
                    
                    <div>
                      <Label>투자금액 (원)</Label>
                      <Input
                        readOnly
                        value={newStock.totalValue && newStock.totalValue > 0 ? `${newStock.totalValue.toLocaleString()}원` : ''}
                        placeholder="투자금액이 계산됩니다"
                      />
                    </div>
                  </div>
                )}

                {selectedStock && newStock.shares && newStock.shares > 0 && (
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={addStock} 
                      className="bg-[#009178] hover:bg-[#004e42]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      종목 추가
                    </Button>
                  </div>
                )}
              </div>

              
              <div className="p-4 bg-[#f9fafb] rounded-lg border">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-[#1f2937]">
                    총 투자금액: {calculateTotalValue().toLocaleString()}원
                  </div>
                  <div className="text-sm text-[#6b7280]">
                    {formData.stockHoldings.length}개 종목
                  </div>
                </div>
              </div>

              
              {formData.stockHoldings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-[#1f2937]">추가된 종목</h4>
                  {formData.stockHoldings.map((stock, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{stock.name} ({stock.symbol})</div>
                        <div className="text-sm text-[#6b7280]">
                          {stock.shares}주 × {stock.currentPrice.toLocaleString()}원 = {stock.totalValue.toLocaleString()}원
                          <span className="ml-2 text-[#009178] font-medium">({stock.weight.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editStock(index)}
                          className="text-[#374151] hover:text-[#111827]"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStock(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              size="lg"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-[#009178] hover:bg-[#004e42]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "수정 중..." : "포트폴리오 수정"}
            </Button>
          </div>
        </form>
      </main>
      
      
      <FloatingChatbot context="portfolio" />
    </div>
  )
}

export default function EditPortfolioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#009178] border-r-transparent"></div>
          <p className="mt-4 text-[#1f2937]">포트폴리오 수정 페이지 로딩 중...</p>
        </div>
      </div>
    }>
      <EditPortfolioContent />
    </Suspense>
  )
}

