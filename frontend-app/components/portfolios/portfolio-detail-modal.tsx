"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, TrendingUp, Calendar, AlertCircle, Target, Activity } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { PortfolioPieChart } from "./portfolio-pie-chart"

interface Portfolio {
  id: string
  name: string
  description: string
  totalValue: number
  totalChange: number
  totalChangePercent: number
  riskLevel: "낮음" | "보통" | "높음"
  createdAt: string
  holdings: Array<{
    name: string
    percent: number
    amount: number
    change: number
    color: string
  }>
  strategy: {
    name: string
    description: string
    rebalanceFrequency: string
    stopLoss: number
    takeProfit: number
  }
  logs: Array<{
    date: string
    type: "매수" | "매도" | "배당" | "리밸런싱"
    description: string
    amount?: number
  }>
  alerts: Array<{
    type: "info" | "warning" | "success"
    message: string
    date: string
  }>
}

interface PortfolioDetailModalProps {
  portfolio: Portfolio | null
  isOpen: boolean
  onClose: () => void
}

export function PortfolioDetailModal({ portfolio, isOpen, onClose }: PortfolioDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "holdings" | "strategy" | "logs" | "alerts">("overview")

  if (!portfolio) return null

  const tabs = [
    { id: "overview", label: "개요", icon: Activity },
    { id: "holdings", label: "보유종목", icon: TrendingUp },
    { id: "strategy", label: "투자전략", icon: Target },
    { id: "logs", label: "거래내역", icon: Calendar },
    { id: "alerts", label: "알림", icon: AlertCircle },
  ]

  const getAlertColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "매수":
        return "text-blue-600 bg-blue-100"
      case "매도":
        return "text-red-600 bg-red-100"
      case "배당":
        return "text-green-600 bg-green-100"
      case "리밸런싱":
        return "text-purple-600 bg-purple-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#f0f9f7]">
              <div>
                <h2 className="text-2xl font-bold text-[#1f2937]">{portfolio.name}</h2>
                <p className="text-[#6b7280] mt-1">{portfolio.description}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <X className="h-6 w-6 text-[#6b7280]" />
              </button>
            </div>

            
            <div className="flex border-b border-gray-200 bg-white px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-[#009178] text-[#009178]"
                        : "border-transparent text-[#6b7280] hover:text-[#1f2937]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#f0f9f7] rounded-xl p-4">
                      <div className="text-sm text-[#6b7280] mb-1">총 자산</div>
                      <div className="text-2xl font-bold text-[#1f2937]">{formatCurrency(portfolio.totalValue)}</div>
                    </div>
                    <div className="bg-[#f0f9f7] rounded-xl p-4">
                      <div className="text-sm text-[#6b7280] mb-1">수익률</div>
                      <div
                        className={`text-2xl font-bold ${portfolio.totalChangePercent > 0 ? "text-[#dc2626]" : "text-[#009178]"}`}
                      >
                        {formatPercent(portfolio.totalChangePercent)}
                      </div>
                    </div>
                    <div className="bg-[#f0f9f7] rounded-xl p-4">
                      <div className="text-sm text-[#6b7280] mb-1">수익금</div>
                      <div
                        className={`text-2xl font-bold ${portfolio.totalChange > 0 ? "text-[#dc2626]" : "text-[#009178]"}`}
                      >
                        {formatCurrency(portfolio.totalChange)}
                      </div>
                    </div>
                  </div>

                  
                  <div className="bg-white rounded-xl border border-[#009178] p-6">
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-4">포트폴리오 구성</h3>
                    <PortfolioPieChart data={portfolio.holdings.map((h) => ({ ...h, trend: h.change, shares: h.shares }))} />
                  </div>
                </div>
              )}

              {activeTab === "holdings" && (
                <div className="space-y-4">
                  {portfolio.holdings.map((holding, index) => (
                    <motion.div
                      key={holding.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-[#f0f9f7] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: holding.color }}></div>
                        <div>
                          <div className="font-semibold text-[#1f2937]">{holding.name}</div>
                          <div className="text-sm text-[#6b7280]">{holding.percent}% 비중</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#1f2937]">{formatCurrency(holding.amount)}</div>
                        <div className={`text-sm ${holding.change > 0 ? "text-[#dc2626]" : "text-[#009178]"}`}>
                          {formatPercent(holding.change)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === "strategy" && (
                <div className="space-y-6">
                  <div className="bg-[#f0f9f7] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-4">{portfolio.strategy.name}</h3>
                    <p className="text-[#6b7280] mb-4">{portfolio.strategy.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-[#6b7280] mb-1">리밸런싱 주기</div>
                        <div className="font-semibold text-[#1f2937]">{portfolio.strategy.rebalanceFrequency}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#6b7280] mb-1">손절매</div>
                        <div className="font-semibold text-[#dc2626]">{formatPercent(portfolio.strategy.stopLoss)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#6b7280] mb-1">익절매</div>
                        <div className="font-semibold text-[#009178]">
                          {formatPercent(portfolio.strategy.takeProfit)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-3">
                  {portfolio.logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-[#f0f9f7] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                        <div>
                          <div className="font-medium text-[#1f2937]">{log.description}</div>
                          <div className="text-sm text-[#6b7280]">{log.date}</div>
                        </div>
                      </div>
                      {log.amount && <div className="font-semibold text-[#1f2937]">{formatCurrency(log.amount)}</div>}
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === "alerts" && (
                <div className="space-y-3">
                  {portfolio.alerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${getAlertColor(alert.type)}`}
                    >
                      <div className="font-medium mb-1">{alert.message}</div>
                      <div className="text-sm opacity-75">{alert.date}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
