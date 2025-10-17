"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Calendar, Target, Activity, PieChart, Plus, Loader2, Play, CheckCircle, XCircle, Edit, MoreVertical, Trash2 } from "lucide-react"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import type { BacktestResponse, BacktestStatus } from "@/types/portfolio"
import { formatCurrency, formatPercent } from "@/utils/formatters"
import { PortfolioPieChart } from "./portfolio-pie-chart"
import { PortfolioAnalysisTab } from "./PortfolioAnalysisTab"
import { fetchPortfolioBacktests, executeBacktest } from "@/lib/api"
import { deleteBacktest } from "@/lib/api/backtests"
import { useBacktest } from "@/contexts/BacktestContext"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PortfolioTabContentProps {
  portfolio: PortfolioWithDetails
  activeTab: "holdings" | "backtests" | "analysis"
}

export function PortfolioTabContent({ portfolio, activeTab }: PortfolioTabContentProps) {
  const [backtests, setBacktests] = useState<BacktestResponse[]>([])
  const [isLoadingBacktests, setIsLoadingBacktests] = useState(false)
  const [backtestError, setBacktestError] = useState<string | null>(null)
  const [executingBacktests, setExecutingBacktests] = useState<Set<number>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [backtestToDelete, setBacktestToDelete] = useState<{id: number, name: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { 
    getBacktestStatus, 
    hasRunningBacktests, 
    startPolling, 
    stopPolling,
    updateBacktestStatus 
  } = useBacktest()

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (error) {
      return dateString
    }
  }

  const getBacktestDisplayStatus = useCallback((backtest: BacktestResponse): BacktestStatus => {
    const globalStatus = getBacktestStatus(portfolio.id.toString(), backtest.id.toString())
    if (globalStatus) {
      return globalStatus.toLowerCase() as BacktestStatus
    }
    
    const serverStatus = backtest.status?.toLowerCase()
    if (serverStatus === 'completed' || serverStatus === 'failed' || serverStatus === 'running' || serverStatus === 'created') {
      return serverStatus as BacktestStatus
    }
    
    return 'created'
  }, [getBacktestStatus, portfolio.id])

  const handleExecuteBacktest = useCallback(async (backtestId: number) => {
    setExecutingBacktests(prev => new Set([...prev, backtestId]))
    
    try {
      const result = await executeBacktest(backtestId)
      
      updateBacktestStatus(portfolio.id.toString(), backtestId.toString(), 'RUNNING')
      
      startPolling(portfolio.id.toString())
      
    } catch (error) {
      console.error("백테스트 실행 실패:", error)
      
      alert(error instanceof Error ? error.message : "백테스트 실행에 실패했습니다.")
    } finally {
      setExecutingBacktests(prev => {
        const newSet = new Set(prev)
        newSet.delete(backtestId)
        return newSet
      })
    }
  }, [portfolio.id, updateBacktestStatus, startPolling])

  const handleDeleteClick = (backtestId: number, backtestName: string) => {
    setBacktestToDelete({ id: backtestId, name: backtestName })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!backtestToDelete) return

    setIsDeleting(true)
    try {
      const success = await deleteBacktest(backtestToDelete.id.toString(), portfolio.id.toString())
      if (success) {
        setDeleteDialogOpen(false)
        setBacktestToDelete(null)
        await loadBacktests()
      }
    } catch (error) {
      console.error("백테스트 삭제 실패:", error)
      alert(error instanceof Error ? error.message : "백테스트 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  const loadBacktests = useCallback(async () => {
    if (isLoadingBacktests) return
    
    setIsLoadingBacktests(true)
    setBacktestError(null)
    
    try {
      const backtestData = await fetchPortfolioBacktests(portfolio.id.toString())
      setBacktests(backtestData)
      
      const hasRunning = backtestData.some(bt => {
        const status = bt.status?.toLowerCase()
        return status === 'running'
      })
      
      if (hasRunning) {
        startPolling(portfolio.id.toString())
      }
    } catch (error) {
        console.error("백테스트 조회 실패:", error)
      setBacktestError(error instanceof Error ? error.message : "백테스트 내역을 불러오는데 실패했습니다.")
    } finally {
      setIsLoadingBacktests(false)
    }
  }, [portfolio.id, startPolling])

  useEffect(() => {
    if (activeTab === "backtests" && !isLoadingBacktests) {
      loadBacktests()
    }
  }, [activeTab, portfolio.id, loadBacktests])

  useEffect(() => {
    if (activeTab === "backtests" && backtests.length > 0) {
      const hasRunning = backtests.some(bt => getBacktestDisplayStatus(bt) === 'running')
      
      if (hasRunning) {
        startPolling(portfolio.id.toString())
      } else {
        stopPolling(portfolio.id.toString())
      }
    }
  }, [activeTab, backtests, getBacktestDisplayStatus, startPolling, stopPolling, portfolio.id])

  return (
    <div className="min-h-[400px]">
      {activeTab === "holdings" && (
        <div className="bg-[#f0f9f7] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#1f2937] mb-4">자산 구성 및 보유 종목</h3>

          <div className="flex flex-row gap-6">
            
            <div className="w-1/3 flex-shrink-0 flex items-center justify-center py-4">
              <PortfolioPieChart
                data={portfolio.holdingStocks.map((stock, index) => ({
                  name: stock.name,
                  percent: stock.weight,
                  trend: stock.dailyRate,
                  color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                  amount: stock.value,
                  shares: stock.shares,
                }))}
                height={`${portfolio.holdingStocks.length * 80 + 16}px`}
              />
            </div>

            
            <div className="w-2/3 space-y-3">
              {portfolio.holdingStocks.map((stock, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }} 
                    />
                    <div>
                      <div className="font-semibold text-[#1f2937]">{stock.name}</div>
                      <div className="text-sm text-[#6b7280]">비중: {stock.weight.toFixed(2)}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#1f2937] text-lg">{formatCurrency(stock.value)}</div>
                    <div
                      className={`text-sm font-medium ${stock.dailyRate >= 0 ? "text-[#009178]" : "text-[#dc2626]"}`}
                    >
                      {formatPercent(stock.dailyRate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "backtests" && (
        <div className="bg-[#f0f9f7] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#009178]" />
              <h3 className="text-lg font-semibold text-[#1f2937]">백테스트 내역</h3>
            </div>
            <Link href={`/portfolios/${portfolio.id}/backtests/create`}>
              <button className="flex items-center gap-2 bg-[#009178] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#004e42]">
                <Plus className="w-4 h-4" /> 백테스트 추가
              </button>
            </Link>
          </div>
          {isLoadingBacktests && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#009178]" />
              <span className="ml-2 text-[#6b7280]">백테스트 내역을 불러오는 중...</span>
            </div>
          )}
          
          {backtestError && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-[#1f2937] mb-2">백테스트 내역이 없습니다</h3>
              <p className="text-[#6b7280] mb-6 max-w-sm mx-auto">
                이 포트폴리오에 대한 백테스트 내역이<br />아직 생성되지 않았습니다.
              </p>
              
              <div className="space-y-3">
                <Link href={`/portfolios/${portfolio.id}/backtests/create`}>
                  <button className="bg-[#009178] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#004e42] transition-colors">
                    백테스트 생성하기
                  </button>
                </Link>
                <div className="text-sm text-[#6b7280]">
                  또는 <button 
                    onClick={loadBacktests}
                    className="text-[#009178] hover:text-[#004e42] underline"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!isLoadingBacktests && !backtestError && (
            <div className="space-y-2">
              {backtests.map((bt) => {
                const displayStatus = getBacktestDisplayStatus(bt)
                const isExecuting = executingBacktests.has(bt.id)
                
                
                return (
                  <div key={bt.id} className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-[#1f2937]">{bt.name}</div>
                          
                          {displayStatus === 'running' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              실행중
                            </div>
                          )}
                          {displayStatus === 'completed' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              <CheckCircle className="w-3 h-3" />
                              완료
                            </div>
                          )}
                          {displayStatus === 'failed' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              <XCircle className="w-3 h-3" />
                              실패
                            </div>
                          )}
                          {displayStatus === 'created' && (
                            <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              미실행
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-[#6b7280] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {formatDateTime(bt.createdAt)} · 기간 {bt.period}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        
                        <div className="flex items-center gap-2">
                          
                          {(!displayStatus || displayStatus === 'created') && !isExecuting && (
                            <>
                              <button
                                onClick={() => handleExecuteBacktest(bt.id)}
                                className="flex items-center gap-1 bg-[#009178] text-white px-3 py-1.5 rounded text-sm hover:bg-[#004e42] transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                실행
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                    <MoreVertical className="w-4 h-4 text-[#6b7280]" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={`/portfolios/${portfolio.id}/backtests/${bt.id}/edit`} className="flex items-center">
                                      <Edit className="w-4 h-4 mr-2" />
                                      수정
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(bt.id, bt.name)} 
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                          
                          
                          {displayStatus === 'running' && (
                            <>
                              <div className="flex items-center gap-1 px-3 py-1.5 text-blue-600 text-sm">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                실행중...
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                    <MoreVertical className="w-4 h-4 text-[#6b7280]" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(bt.id, bt.name)} 
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                          
                          
                          {displayStatus === 'completed' && (
                            <>
                              <Link href={`/portfolios/backtests/${bt.id}`}>
                                <button className="px-3 py-1.5 border border-[#009178] text-[#009178] rounded text-sm hover:bg-[#f0f9f7] transition-colors">
                                  상세보기
                                </button>
                              </Link>
                              {!isExecuting && (
                                <button
                                  onClick={() => handleExecuteBacktest(bt.id)}
                                  className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 transition-colors"
                                >
                                  <Play className="w-3 h-3" />
                                  재실행
                                </button>
                              )}
                              {isExecuting && (
                                <div className="flex items-center gap-1 px-3 py-1.5 text-orange-600 text-sm">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  재실행 중...
                                </div>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                    <MoreVertical className="w-4 h-4 text-[#6b7280]" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={`/portfolios/${portfolio.id}/backtests/${bt.id}/edit`} className="flex items-center">
                                      <Edit className="w-4 h-4 mr-2" />
                                      수정
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(bt.id, bt.name)} 
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                          
                          
                          {displayStatus === 'failed' && !isExecuting && (
                            <>
                              <button
                                onClick={() => handleExecuteBacktest(bt.id)}
                                className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                재실행
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                    <MoreVertical className="w-4 h-4 text-[#6b7280]" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={`/portfolios/${portfolio.id}/backtests/${bt.id}/edit`} className="flex items-center">
                                      <Edit className="w-4 h-4 mr-2" />
                                      수정
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(bt.id, bt.name)} 
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                          
                          
                          {displayStatus === 'failed' && isExecuting && (
                            <>
                              <div className="flex items-center gap-1 px-3 py-1.5 text-orange-600 text-sm">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                재실행 중...
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                    <MoreVertical className="w-4 h-4 text-[#6b7280]" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(bt.id, bt.name)} 
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                          
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {backtests.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-[#1f2937] mb-2">백테스트 내역이 없습니다</h3>
                  <p className="text-[#6b7280] mb-6 max-w-sm mx-auto">
                    이 포트폴리오에 대한 백테스트 내역이<br />아직 생성되지 않았습니다.
                  </p>
                  
                  <Link href={`/portfolios/${portfolio.id}/backtests/create`}>
                    <button className="bg-[#009178] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#004e42] transition-colors">
                      백테스트 생성하기
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "analysis" && (
        <PortfolioAnalysisTab 
          portfolioId={portfolio.id}
          holdings={portfolio.holdingStocks}
        />
      )}

      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle>백테스트 삭제</DialogTitle>
            <DialogDescription className="pt-2">
              정말로 <span className="font-semibold text-[#1f2937]">"{backtestToDelete?.name}"</span> 백테스트를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
