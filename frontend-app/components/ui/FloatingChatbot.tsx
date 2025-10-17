"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { sendContextChatMessage } from '@/lib/api/chat'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface FloatingChatbotProps {
  className?: string
  context?: 'portfolio' | 'backtest' | 'create-portfolio'
}

export default function FloatingChatbot({ className = '', context = 'portfolio' }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: context === 'portfolio' 
        ? '안녕하세요! 포트폴리오 관리에 대해 궁금한 점이 있으시면 언제든 물어보세요. 투자 전략, 리스크 관리, 수익률 분석 등에 대해 도움을 드릴 수 있어요.' 
        : context === 'backtest'
        ? '안녕하세요! 백테스트 결과에 대해 궁금한 점이 있으시면 언제든 물어보세요. 수익률 지표, 리스크 분석, 투자 전략 개선 방법 등에 대해 도움을 드릴 수 있어요.'
        : '안녕하세요! 포트폴리오 생성에 도움이 필요하시군요! 종목 선택, 비중 설정, 리밸런싱 규칙, 손익 관리 등 포트폴리오 구성에 대해 궁금한 점을 물어보세요.',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await sendContextChatMessage(context, currentInput)
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('챗봇 API 호출 실패:', error)
      
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(currentInput, context),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const getBotResponse = (userInput: string, context: string): string => {
    const input = userInput.toLowerCase()
    
    if (context === 'portfolio') {
      if (input.includes('수익률') || input.includes('수익')) {
        return '포트폴리오 수익률을 높이려면 분산투자와 정기적인 리밸런싱이 중요해요. 또한 각 종목의 비중을 조절하여 리스크를 관리하시는 것을 추천드려요.'
      }
      if (input.includes('리스크') || input.includes('위험')) {
        return '포트폴리오 리스크는 변동성, 최대낙폭, 샤프비율 등으로 측정할 수 있어요. 다양한 섹터와 자산군에 분산투자하면 리스크를 줄일 수 있습니다.'
      }
      if (input.includes('리밸런싱')) {
        return '리밸런싱은 일정 기간마다 또는 목표 비중에서 벗어났을 때 실행하는 것이 좋아요. 보통 분기별 또는 반기별로 하시면 됩니다.'
      }
      return '포트폴리오 관리에 대한 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있어요. 수익률, 리스크 관리, 종목 선택 등에 대해 궁금한 점이 있으시면 언제든 물어보세요!'
    } else if (context === 'backtest') {
      if (input.includes('샤프') || input.includes('sharpe')) {
        return '샤프 비율이 1 이상이면 양호한 편이에요. 이는 위험 대비 수익이 좋다는 의미입니다. 더 높은 샤프 비율을 위해서는 변동성을 줄이거나 수익률을 높이는 전략을 고려해보세요.'
      }
      if (input.includes('최대낙폭') || input.includes('낙폭') || input.includes('drawdown')) {
        return '최대낙폭은 투자 기간 중 가장 큰 손실을 나타내요. 일반적으로 15% 이하면 양호하다고 볼 수 있어요. 손절매 전략이나 헤지 전략으로 낙폭을 줄일 수 있습니다.'
      }
      if (input.includes('수익률')) {
        return '백테스트 수익률이 시장 수익률(KOSPI)을 상회한다면 좋은 전략이에요. 하지만 리스크도 함께 고려해야 해요. 위험조정수익률(샤프비율 등)을 확인해보시길 권합니다.'
      }
      return '백테스트 결과에 대한 구체적인 질문을 해주시면 더 정확한 분석을 도와드릴 수 있어요. 수익률, 리스크 지표, 전략 개선 방법 등에 대해 궁금한 점이 있으시면 언제든 물어보세요!'
    } else {
      if (input.includes('종목') || input.includes('주식') || input.includes('선택')) {
        return '좋은 종목 선택을 위해서는 기업의 재무상태, 성장성, 업종 전망을 고려하세요. 또한 상관관계가 낮은 다양한 섹터의 종목을 선택하여 분산투자 효과를 높이는 것이 중요해요.'
      }
      if (input.includes('비중') || input.includes('비율') || input.includes('배분')) {
        return '포트폴리오 비중은 각 종목의 리스크와 기대수익률을 고려해서 설정하세요. 일반적으로 한 종목이 전체의 20%를 넘지 않도록 하고, 안정성을 원한다면 더 균등하게 배분하는 것을 추천해요.'
      }
      if (input.includes('리밸런싱') || input.includes('규칙')) {
        return '리밸런싱 규칙은 포트폴리오 유지관리의 핵심이에요. 정기 리밸런싱(분기별/반기별)이나 비중 이탈 방식(목표 비중에서 ±5% 벗어날 때)을 선택할 수 있어요.'
      }
      if (input.includes('손절') || input.includes('손실') || input.includes('위험')) {
        return '손실 제한 규칙으로 MDD(최대낙폭) 초과나 손실 한계선을 설정할 수 있어요. 보통 포트폴리오 전체 손실이 15-20%에 도달하면 일부 매도하는 것을 고려해보세요.'
      }
      if (input.includes('수익') || input.includes('익절')) {
        return '수익 실현 규칙으로 단일 종목이 목표 수익률에 도달했을 때 일부 매도하는 방식을 설정할 수 있어요. 너무 욕심내지 말고 20-30% 수익에서 부분 매도를 고려해보세요.'
      }
      return '포트폴리오 생성에 대한 구체적인 질문을 해주시면 더 정확한 조언을 드릴 수 있어요. 종목 선택, 비중 설정, 리밸런싱 규칙, 손익 관리 등에 대해 궁금한 점이 있으시면 언제든 물어보세요!'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-16 right-0 mb-2 whitespace-nowrap max-w-none"
                  >
                    <div className="bg-[#1f2937] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg relative">
                      <div className="whitespace-nowrap">
                        {context === 'portfolio' 
                          ? '💼 포트폴리오 관리 도움이 필요하세요?' 
                          : context === 'backtest'
                          ? '📊 백테스트 결과가 궁금하세요?'
                          : '✨ 포트폴리오 생성 도움이 필요하세요?'
                        }
                      </div>
                      
                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1f2937]"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <Button
                onClick={() => {
                  setIsOpen(true)
                  setShowTooltip(false)
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setTimeout(() => setShowTooltip(false), 1000)}
                className="w-14 h-14 rounded-full bg-[#009178] hover:bg-[#006b6c] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] max-h-[calc(100vh-120px)] max-w-96"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="h-full shadow-2xl border border-[#009178]/20">
              <CardHeader className="bg-[#009178] text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    <h3 className="font-semibold">AI 투자 도우미</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
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
                      <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                          <p className="text-sm leading-relaxed">{message.content}</p>
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
                      <div className="flex gap-2 max-w-[80%]">
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
                      placeholder="메시지를 입력하세요..."
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
        )}
      </AnimatePresence>
    </>
  )
}
