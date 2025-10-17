"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { sendChatMessage } from '@/lib/api/chat'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface TermChatbotProps {
  isOpen: boolean
  onClose: () => void
  term: 'loss' | 'profit' | 'benchmark'
}

const TERM_EXPLANATIONS = {
  loss: {
    title: '손절 (Stop Loss)',
    explanation: `손절은 투자 손실을 제한하기 위해 미리 설정한 기준에 도달했을 때 포지션을 정리하는 투자 기법입니다.

주요 손절 기준과 설정값:
• 베타 일정값 초과: 포트폴리오의 시장 민감도가 설정한 값을 초과할 때
  → 입력값: 소수점 형태 (예: 1.2, 1.5, 2.0)
  
• VaR 초과: 예상 최대 손실(Value at Risk)이 허용 한계를 넘을 때  
  → 입력값: 퍼센트 형태 (예: 5%, 10%, 15%)
  
• MDD 초과: 최대낙폭(Maximum Drawdown)이 설정한 비율을 초과할 때
  → 입력값: 퍼센트 형태 (예: 15%, 20%, 25%)
  
• 손실 한계선: 절대적인 손실 비율 기준을 초과할 때
  → 입력값: 퍼센트 형태 (예: -10%, -15%, -20%)

손절은 감정적 판단을 배제하고 체계적으로 리스크를 관리하는 핵심 도구입니다.`
  },
  profit: {
    title: '익절 (Take Profit)', 
    explanation: `익절은 목표 수익률에 도달했을 때 수익을 확정하기 위해 포지션을 정리하는 투자 기법입니다.

주요 익절 기준과 설정값:
• 단일 종목 목표 수익률 달성: 개별 종목이 설정한 목표 수익률에 도달했을 때
  → 입력값: 퍼센트 형태 (예: 20%, 30%, 50%)

익절의 장점:
• 수익 확정으로 심리적 안정감 제공
• 과도한 욕심으로 인한 손실 방지
• 수익을 재투자할 기회 창출
• 포트폴리오 리밸런싱 기회 제공

권장 익절 수익률: 보수적 투자자는 15-20%, 적극적 투자자는 30-50% 수준에서 고려해보세요.`
  },
  benchmark: {
    title: '벤치마크 지수 (Benchmark Index)',
    explanation: `벤치마크 지수는 포트폴리오의 성과를 평가하기 위한 비교 기준이 되는 지수입니다.

주요 벤치마크 지수:
• KOSPI: 한국종합주가지수 - 대한민국 주식시장의 대표 지수
  → 대형주 중심으로 구성되어 시장 전체 동향을 반영
  → 시가총액 기준 상위 종목들이 주요 구성요소
  
• KOSDAQ: 코스닥 지수 - 중소기업 및 벤처기업 중심 지수  
  → 성장성 높은 기술주와 중소기업 중심으로 구성
  → KOSPI 대비 높은 변동성과 성장 잠재력

벤치마크 선택 기준:
• 포트폴리오 구성과 유사한 성격의 지수 선택
• 대형주 중심 포트폴리오 → KOSPI
• 중소형주/성장주 중심 포트폴리오 → KOSDAQ

벤치마크를 통해 절대수익률뿐만 아니라 상대적 성과도 평가할 수 있습니다.`
  }
}

export default function TermChatbot({ isOpen, onClose, term }: TermChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      const termData = TERM_EXPLANATIONS[term]
      const initialMessage: Message = {
        id: '1',
        type: 'bot',
        content: `${termData.title}에 대해 설명드리겠습니다.\n\n${termData.explanation}\n\n더 궁금한 점이 있으시면 언제든 질문해주세요!`,
        timestamp: new Date()
      }
      setMessages([initialMessage])
    }
  }, [isOpen, term])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await sendChatMessage(term, inputValue)
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('챗봇 API 오류:', error)
      
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getFallbackResponse(inputValue, term),
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const getFallbackResponse = (userInput: string, termType: string): string => {
    const input = userInput.toLowerCase()
    
    if (termType === 'loss') {
      if (input.includes('베타') || input.includes('beta')) {
        return '베타는 개별 자산이나 포트폴리오가 시장 전체의 움직임에 얼마나 민감하게 반응하는지를 나타내는 지표입니다. 베타가 1보다 크면 시장보다 변동성이 크고, 1보다 작으면 시장보다 안정적입니다.'
      }
      if (input.includes('var') || input.includes('밸류')) {
        return 'VaR(Value at Risk)는 정해진 신뢰구간과 기간 하에서 예상되는 최대 손실금액을 의미합니다. 예를 들어, 95% 신뢰구간에서 1일 VaR가 100만원이라면, 95% 확률로 하루 손실이 100만원을 넘지 않을 것으로 예상됩니다.'
      }
      if (input.includes('mdd') || input.includes('낙폭') || input.includes('drawdown')) {
        return 'MDD(Maximum Drawdown)는 투자 기간 중 최고점에서 최저점까지의 최대 하락폭을 의미합니다. 포트폴리오의 위험성을 측정하는 중요한 지표로, MDD가 낮을수록 안정적인 투자라고 볼 수 있습니다.'
      }
      return '손절에 대한 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있어요. 베타, VaR, MDD, 손실 한계선 등에 대해 궁금한 점이 있으시면 언제든 물어보세요!'
    } else if (termType === 'profit') {
      if (input.includes('목표') || input.includes('수익률')) {
        return '목표 수익률 설정 시에는 해당 종목의 과거 성과, 업종 평균, 시장 상황 등을 종합적으로 고려해야 합니다. 일반적으로 20-30% 수익률에서 부분 익절을 고려하는 것이 좋습니다.'
      }
      if (input.includes('타이밍') || input.includes('언제')) {
        return '익절 타이밍은 개인의 투자 목표와 시장 상황에 따라 달라집니다. 목표 수익률 달성 시 전량 매도보다는 분할 매도를 통해 추가 상승 가능성을 남겨두는 것도 좋은 전략입니다.'
      }
      return '익절에 대한 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있어요. 목표 수익률 설정, 익절 타이밍, 분할 매도 전략 등에 대해 궁금한 점이 있으시면 언제든 물어보세요!'
    } else {
      if (input.includes('kospi') || input.includes('코스피')) {
        return 'KOSPI는 한국종합주가지수로 대한민국 주식시장의 대표 지수입니다. 삼성전자, SK하이닉스 등 대형주가 큰 비중을 차지하며, 시장 전체의 흐름을 잘 반영합니다. 안정적이고 대형주 중심의 포트폴리오와 비교하기에 적합합니다.'
      }
      if (input.includes('kosdaq') || input.includes('코스닥')) {
        return 'KOSDAQ은 중소기업과 벤처기업 중심의 지수입니다. 기술주와 성장주의 비중이 높아 KOSPI보다 변동성이 크지만, 성장 잠재력도 높습니다. 중소형주나 성장주 중심의 포트폴리오와 비교하기에 적합합니다.'
      }
      if (input.includes('선택') || input.includes('어떤') || input.includes('차이')) {
        return '벤치마크 선택은 포트폴리오 구성에 따라 달라집니다. 대형주 중심이면 KOSPI, 중소형주/성장주 중심이면 KOSDAQ을 선택하는 것이 좋습니다. 벤치마크와 유사한 성격의 지수를 선택해야 정확한 성과 비교가 가능합니다.'
      }
      return '벤치마크 지수에 대한 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있어요. KOSPI, KOSDAQ의 특징이나 선택 기준 등에 대해 궁금한 점이 있으시면 언제든 물어보세요!'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClose = () => {
    setMessages([])
    setInputValue('')
    setIsTyping(false)
    onClose()
  }

  if (!isOpen) return null

  const termData = TERM_EXPLANATIONS[term]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="w-full max-w-2xl h-[600px] max-h-[90vh]"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full shadow-2xl border border-[#009178]/20">
            <CardHeader className="bg-[#009178] text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <h3 className="font-semibold">{termData.title} 도우미</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col h-full p-0">
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-[#009178] text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-[#009178] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="text-sm leading-relaxed whitespace-pre-line">
                          {message.content}
                        </div>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="궁금한 점을 질문해보세요..."
                    className="flex-1 border-gray-200 focus:border-[#009178] focus:ring-[#009178]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-[#009178] hover:bg-[#006b6c] text-white"
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
