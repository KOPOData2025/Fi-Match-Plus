"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, Target, Activity, PieChart, MoreVertical, Edit, Trash2 } from "lucide-react"
import type { PortfolioWithDetails } from "@/lib/api/portfolios"
import { deletePortfolio } from "@/lib/api/portfolios"
import { formatCurrency, formatPercent } from "@/utils/formatters"
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

interface PortfolioDetailHeaderProps {
  portfolio: PortfolioWithDetails
  activeTab: "holdings" | "backtests" | "analysis"
  onTabChange: (tabId: "holdings" | "backtests" | "analysis") => void
  onPortfolioDeleted?: () => void
}

export function PortfolioDetailHeader({ portfolio, activeTab, onTabChange, onPortfolioDeleted }: PortfolioDetailHeaderProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const tabs = [
    { id: "holdings" as const, label: "보유종목", icon: PieChart },
    { id: "backtests" as const, label: "백테스트 내역", icon: Activity },
    { id: "analysis" as const, label: "포트폴리오 최적화", icon: Target },
  ]

  const handleEdit = () => {
    router.push(`/portfolios/${portfolio.id}/edit`)
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      const success = await deletePortfolio(portfolio.id)
      if (success) {
        setIsDeleteDialogOpen(false)
        onPortfolioDeleted?.()
      } else {
        alert("포트폴리오 삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error("포트폴리오 삭제 오류:", error)
      alert("포트폴리오 삭제 중 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#1f2937]">{portfolio.name}</h2>
          <p className="text-[#6b7280] mt-1">{portfolio.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1f2937]">{formatCurrency(portfolio.totalAssets)}</div>
            <div className={`flex items-center gap-1 justify-end ${portfolio.dailyRate >= 0 ? "text-[#009178]" : "text-[#dc2626]"}`}>
              {portfolio.dailyRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">{formatPercent(portfolio.dailyRate)}</span>
              <span className="text-sm">
                ({portfolio.dailyChange >= 0 ? "+" : ""}
                {formatCurrency(portfolio.dailyChange)})
              </span>
            </div>
          </div>
          
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-[#f0f9f7] transition-colors">
                <MoreVertical className="w-5 h-5 text-[#6b7280]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteClick} 
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      
      <div className="flex gap-2 mb-6 p-1 bg-[#f0f9f7] rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-[#009178] shadow-sm"
                  : "text-[#6b7280] hover:text-[#1f2937] hover:bg-white/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>포트폴리오 삭제</DialogTitle>
            <DialogDescription className="pt-2">
              정말로 <span className="font-semibold text-[#1f2937]">"{portfolio.name}"</span> 포트폴리오를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
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
    </>
  )
}
