"use client"

import { useRouter, useParams } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { ArrowLeft, Save, Plus, X, ChevronDown, ChevronRight } from "lucide-react"
import TermHelpButton from "@/components/ui/TermHelpButton"
import TermChatbot from "@/components/ui/TermChatbot"
import { CreateBacktestData, StopCondition } from "@/types/portfolio"
import { createBacktest, transformToBacktestRequest, CreateBacktestResponse } from "@/lib/api/backtests"
import { fetchPortfolioDetail } from "@/lib/api/portfolios"
import { useBacktest } from "@/contexts/BacktestContext"

const STOP_CONDITION_TYPES = [
  { value: 'stopLoss', label: '손절', description: '손실 한계선 설정' },
  { value: 'takeProfit', label: '익절', description: '수익 목표 달성' },
  { value: 'period', label: '기간 설정', description: '시작일과 종료일 설정' }
] as const

const STOP_LOSS_CRITERIA = ["베타 일정값 초과", "VaR 초과", "MDD 초과", "손실 한계선"]
const TAKE_PROFIT_CRITERIA = ["단일 종목 목표 수익률 달성"]

export default function CreateBacktestPage() {
  const router = useRouter()
  const params = useParams()
  const portfolioId = params.portfolioId as string
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [portfolioDetail, setPortfolioDetail] = useState<any>(null)
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("")
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const [formData, setFormData] = useState<CreateBacktestData>({
    name: "",
    memo: "",
    stopConditions: []
  })

  const { updateBacktestStatus, startPolling } = useBacktest()

  const [newStopCondition, setNewStopCondition] = useState<{
    type: 'stopLoss' | 'takeProfit' | 'period'
    criteria?: string
    value?: string
    startDate?: string
    endDate?: string
    description?: string
  }>({
    type: 'period',
    criteria: '',
    value: '',
    startDate: '',
    endDate: '',
    description: ''
  })

  const [openSections, setOpenSections] = useState<{
    stopLoss: boolean
    takeProfit: boolean
    period: boolean
  }>({
    stopLoss: false,
    takeProfit: false,
    period: true 
  })

  const [chatbotOpen, setChatbotOpen] = useState<{
    isOpen: boolean
    term: 'loss' | 'profit' | 'benchmark' | null
  }>({
    isOpen: false,
    term: null
  })

  useEffect(() => {
    const loadPortfolioDetail = async () => {
      try {
        setLoading(true)
        const detail = await fetchPortfolioDetail(portfolioId)
        
        if (detail) {
          setPortfolioDetail(detail)
          const defaultBenchmark = detail.rules?.basicBenchmark || "KOSPI"
          setSelectedBenchmark(defaultBenchmark)
        } else {
          setSelectedBenchmark("KOSPI")
        }
      } catch (error) {
        console.error("포트폴리오 상세 로드 실패:", error)
        setSelectedBenchmark("KOSPI")
      } finally {
        setLoading(false)
      }
    }

    if (portfolioId) {
      loadPortfolioDetail()
    } else {
      setSelectedBenchmark("KOSPI")
      setLoading(false)
    }
  }, [portfolioId])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const openChatbot = (term: 'loss' | 'profit' | 'benchmark') => {
    setChatbotOpen({
      isOpen: true,
      term
    })
  }

  const closeChatbot = () => {
    setChatbotOpen({
      isOpen: false,
      term: null
    })
  }

  const handleInputChange = (field: keyof CreateBacktestData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStopConditionChange = (field: string, value: any) => {
    setNewStopCondition(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStopConditionTypeChange = (type: 'stopLoss' | 'takeProfit' | 'period') => {
    setNewStopCondition(prev => {
      if (prev.type === type) {
        return prev
      }
      
      return {
        ...prev,
        type,
        criteria: '',
        value: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    })
  }

  const addStopCondition = () => {
    if (newStopCondition.type === 'period') {
      if (!newStopCondition.startDate || !newStopCondition.endDate) {
        setAlertDialog({
          isOpen: true,
          title: '입력 오류',
          message: '기간 설정의 경우 시작일과 종료일을 모두 입력해주세요.',
          type: 'error'
        })
        return
      }
      if (new Date(newStopCondition.startDate) >= new Date(newStopCondition.endDate)) {
        setAlertDialog({
          isOpen: true,
          title: '입력 오류',
          message: '시작일은 종료일보다 이전이어야 합니다.',
          type: 'error'
        })
        return
      }
    }

    if (newStopCondition.type === 'stopLoss' || newStopCondition.type === 'takeProfit') {
      if (!newStopCondition.criteria?.trim()) {
        setAlertDialog({
          isOpen: true,
          title: '입력 오류',
          message: '손절/익절의 경우 기준을 선택해주세요.',
          type: 'error'
        })
        return
      }
      if (!newStopCondition.value?.trim()) {
        setAlertDialog({
          isOpen: true,
          title: '입력 오류',
          message: '손절/익절의 경우 값을 입력해주세요.',
          type: 'error'
        })
        return
      }
    }

    const stopCondition: StopCondition = {
      id: Date.now().toString(),
      type: newStopCondition.type,
      criteria: newStopCondition.criteria?.trim(),
      value: newStopCondition.value?.trim(),
      startDate: newStopCondition.startDate,
      endDate: newStopCondition.endDate,
      description: newStopCondition.description?.trim()
    }

    setFormData(prev => ({
      ...prev,
      stopConditions: [...prev.stopConditions, stopCondition]
    }))

    setNewStopCondition({
      type: 'period',
      criteria: '',
      value: '',
      startDate: '',
      endDate: '',
      description: ''
    })
  }

  const removeStopCondition = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stopConditions: prev.stopConditions.filter(condition => condition.id !== id)
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!portfolioId) {
      setAlertDialog({
        isOpen: true,
        title: '오류',
        message: '포트폴리오 ID가 필요합니다. 포트폴리오 목록에서 다시 시도해주세요.',
        type: 'error'
      })
      setTimeout(() => router.push("/portfolios"), 1500)
      return
    }
    
    if (!formData.name.trim()) {
      setAlertDialog({
        isOpen: true,
        title: '입력 오류',
        message: '백테스트 이름을 입력해주세요.',
        type: 'error'
      })
      return
    }

    const hasPeriodCondition = formData.stopConditions.some(condition => condition.type === 'period')
    if (!hasPeriodCondition) {
      setAlertDialog({
        isOpen: true,
        title: '입력 오류',
        message: '기간 설정은 필수입니다. 최소 하나의 기간 설정을 추가해주세요.',
        type: 'error'
      })
      return
    }

    if (!selectedBenchmark) {
      setAlertDialog({
        isOpen: true,
        title: '입력 오류',
        message: '벤치마크 지수를 선택해주세요.',
        type: 'error'
      })
      return
    }

    setSubmitting(true)
    try {
      const requestData = transformToBacktestRequest(formData, portfolioId, selectedBenchmark)
      
      const response: CreateBacktestResponse = await createBacktest(portfolioId, requestData)
      
      updateBacktestStatus(portfolioId, response.data, 'CREATED')
      
      setAlertDialog({
        isOpen: true,
        title: '생성 완료',
        message: `백테스트가 성공적으로 생성되었습니다.\n백테스트를 실행해주세요.\n백테스트 ID: ${response.data}`,
        type: 'success'
      })
      
      setTimeout(() => {
        router.push("/portfolios")
      }, 2000)
    } catch (error) {
      console.error("백테스트 요청 실패:", error)
      const errorMessage = error instanceof Error ? error.message : "백테스트 요청에 실패했습니다."
      setAlertDialog({
        isOpen: true,
        title: '생성 실패',
        message: errorMessage,
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f9f7]">
        <Header />
        <main className="max-w-4xl mx-auto pt-8 px-4 pb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
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
          <h1 className="text-3xl font-bold text-[#1f2937]">백테스트 생성</h1>
          <p className="text-[#6b7280] mt-2">중지 조건을 설정하여 백테스트를 실행하세요</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">백테스트 이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="백테스트 이름을 입력하세요"
                  required
                />
              </div>
              <div>
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  value={formData.memo}
                  onChange={(e) => handleInputChange("memo", e.target.value)}
                  placeholder="백테스트에 대한 추가 설명이나 메모를 입력하세요"
                  rows={3}
                />
              </div>
              
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="benchmark">벤치마크 지수</Label>
                  <TermHelpButton 
                    term="benchmark" 
                    onClick={() => openChatbot('benchmark')}
                  />
                </div>
                <Select 
                  value={selectedBenchmark} 
                  onValueChange={(value) => setSelectedBenchmark(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "로딩 중..." : "벤치마크 지수를 선택하세요"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KOSPI">KOSPI</SelectItem>
                    <SelectItem value="KOSDAQ">KOSDAQ</SelectItem>
                  </SelectContent>
                </Select>
                {portfolioDetail?.rules?.basicBenchmark && selectedBenchmark === portfolioDetail.rules.basicBenchmark && (
                  <p className="text-sm text-[#6b7280] mt-1">
                    포트폴리오 기본 벤치마크 지수로 설정되었습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#1f2937]">중지 조건 설정</CardTitle>
              <p className="text-sm text-[#6b7280]">기간 설정은 필수이며, 손절/익절은 선택사항입니다.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => toggleSection("period")}
                  >
                    {openSections.period ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <Label className="text-base font-medium">기간 설정</Label>
                  <Badge variant="destructive" className="text-xs">필수</Badge>
                </div>
                
                <AnimatePresence>
                  {openSections.period && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-4">
                        <div className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="startDate">시작 날짜</Label>
                              <Input
                                id="startDate"
                                type="date"
                                value={newStopCondition.type === 'period' ? newStopCondition.startDate || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'period',
                                    startDate: e.target.value
                                  }))
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor="endDate">종료 날짜</Label>
                              <Input
                                id="endDate"
                                type="date"
                                value={newStopCondition.type === 'period' ? newStopCondition.endDate || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'period',
                                    endDate: e.target.value
                                  }))
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                setNewStopCondition(prev => ({ ...prev, type: 'period' }))
                                addStopCondition()
                              }}
                              className="bg-[#009178] hover:bg-[#004e42]"
                              disabled={!newStopCondition.startDate || !newStopCondition.endDate || newStopCondition.type !== 'period'}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              기간 조건 추가
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              
              <div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => toggleSection("stopLoss")}
                  >
                    {openSections.stopLoss ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <Label className="text-base font-medium">손절</Label>
                  <TermHelpButton 
                    term="loss" 
                    onClick={() => openChatbot('loss')}
                  />
                  <Badge variant="secondary" className="text-xs">선택</Badge>
                </div>
                
                <AnimatePresence>
                  {openSections.stopLoss && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-4">
                        <div className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor="stopLossCriteria">기준</Label>
                              <Select
                                value={newStopCondition.type === 'stopLoss' ? newStopCondition.criteria || '' : ''}
                                onValueChange={(value) => {
                                  handleStopConditionTypeChange('stopLoss')
                                  handleStopConditionChange('criteria', value)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="기준 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STOP_LOSS_CRITERIA.map((criteria) => (
                                    <SelectItem key={criteria} value={criteria}>
                                      {criteria}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="stopLossValue">값</Label>
                              <Input
                                id="stopLossValue"
                                value={newStopCondition.type === 'stopLoss' ? newStopCondition.value || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'stopLoss',
                                    value: e.target.value
                                  }))
                                }}
                                placeholder="예: -10%, 1.5"
                              />
                            </div>
                            <div>
                              <Label htmlFor="stopLossDescription">설명</Label>
                              <Input
                                id="stopLossDescription"
                                value={newStopCondition.type === 'stopLoss' ? newStopCondition.description || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'stopLoss',
                                    description: e.target.value
                                  }))
                                }}
                                placeholder="추가 설명"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                setNewStopCondition(prev => ({ ...prev, type: 'stopLoss' }))
                                addStopCondition()
                              }}
                              className="bg-[#009178] hover:bg-[#004e42]"
                              disabled={!newStopCondition.criteria || !newStopCondition.value || newStopCondition.type !== 'stopLoss'}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              손절 조건 추가
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              
              <div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => toggleSection("takeProfit")}
                  >
                    {openSections.takeProfit ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <Label className="text-base font-medium">익절</Label>
                  <TermHelpButton 
                    term="profit" 
                    onClick={() => openChatbot('profit')}
                  />
                  <Badge variant="secondary" className="text-xs">선택</Badge>
                </div>
                
                <AnimatePresence>
                  {openSections.takeProfit && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-4">
                        <div className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor="takeProfitCriteria">기준</Label>
                              <Select
                                value={newStopCondition.type === 'takeProfit' ? newStopCondition.criteria || '' : ''}
                                onValueChange={(value) => {
                                  handleStopConditionTypeChange('takeProfit')
                                  handleStopConditionChange('criteria', value)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="기준 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TAKE_PROFIT_CRITERIA.map((criteria) => (
                                    <SelectItem key={criteria} value={criteria}>
                                      {criteria}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="takeProfitValue">값</Label>
                              <Input
                                id="takeProfitValue"
                                value={newStopCondition.type === 'takeProfit' ? newStopCondition.value || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'takeProfit',
                                    value: e.target.value
                                  }))
                                }}
                                placeholder="예: 20%, 30%"
                              />
                            </div>
                            <div>
                              <Label htmlFor="takeProfitDescription">설명</Label>
                              <Input
                                id="takeProfitDescription"
                                value={newStopCondition.type === 'takeProfit' ? newStopCondition.description || '' : ''}
                                onChange={(e) => {
                                  setNewStopCondition(prev => ({
                                    ...prev,
                                    type: 'takeProfit',
                                    description: e.target.value
                                  }))
                                }}
                                placeholder="추가 설명"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                setNewStopCondition(prev => ({ ...prev, type: 'takeProfit' }))
                                addStopCondition()
                              }}
                              className="bg-[#009178] hover:bg-[#004e42]"
                              disabled={!newStopCondition.criteria || !newStopCondition.value || newStopCondition.type !== 'takeProfit'}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              익절 조건 추가
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              
              {formData.stopConditions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-[#1f2937]">추가된 중지 조건</h4>
                  {formData.stopConditions.map((condition) => (
                    <div key={condition.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={condition.type === 'period' ? 'destructive' : 'secondary'}>
                            {STOP_CONDITION_TYPES.find(t => t.value === condition.type)?.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-[#6b7280]">
                          {condition.type === 'period' && condition.startDate && condition.endDate && 
                            `기간: ${condition.startDate} ~ ${condition.endDate}`
                          }
                          {condition.type !== 'period' && condition.criteria && condition.value && 
                            `${condition.criteria}: ${condition.value}`
                          }
                          {condition.description && ` | ${condition.description}`}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStopCondition(condition.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
              disabled={submitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>

        
        {chatbotOpen.isOpen && chatbotOpen.term && (
          <TermChatbot
            isOpen={chatbotOpen.isOpen}
            onClose={closeChatbot}
            term={chatbotOpen.term}
          />
        )}

        
        <Dialog open={alertDialog.isOpen} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="max-w-[425px]">
            <DialogHeader>
              <DialogTitle className={alertDialog.type === 'error' ? 'text-red-600' : 'text-[#009178]'}>
                {alertDialog.title}
              </DialogTitle>
              <DialogDescription className="pt-2 whitespace-pre-line">
                {alertDialog.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                className={alertDialog.type === 'error' ? '' : 'bg-[#009178] hover:bg-[#004e42]'}
              >
                확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


