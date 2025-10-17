"use client"

import Header from "@/components/header"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { BarChart3, TrendingUp, Shield, Zap, Users, FileText, Target, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

const features = [
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "포트폴리오 관리",
    description: "여러 종목을 한 곳에서 관리하고 비중을 조절하며 수익률을 추적할 수 있어요"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "백테스트 분석",
    description: "과거 데이터로 내 투자 전략을 미리 검증해보고 수익률을 확인하세요"
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "포트폴리오 성향 리포팅",
    description: "실제 포트폴리오 구성을 분석하여 진단해드려요"
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "모델 포트폴리오 제공",
    description: "제공하는 다양한 모델 포트폴리오를 참고하여 투자하세요"
  }
]

export default function LandingPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const totalSections = 1

  const nextSection = () => {
    setCurrentSection((prev) => (prev + 1) % totalSections)
  }

  const prevSection = () => {
    setCurrentSection((prev) => (prev - 1 + totalSections) % totalSections)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevSection()
      } else if (event.key === 'ArrowRight') {
        nextSection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const SectionWrapper = ({ children, sectionKey }: { children: React.ReactNode, sectionKey: string }) => (
    <motion.section
      key={sectionKey}
      custom={currentSection}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = swipePower(offset.x, velocity.x)

        if (swipe < -swipeConfidenceThreshold) {
          nextSection()
        } else if (swipe > swipeConfidenceThreshold) {
          prevSection()
        }
      }}
      className="relative flex flex-col px-8 py-4"
    >
      <div className="max-w-6xl mx-auto w-full flex-1">
        {children}
      </div>
      
      
      <div className="flex justify-center pb-8">
        <div className="flex gap-3">
          {Array.from({ length: totalSections }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSection 
                  ? 'bg-[#009178] scale-125' 
                  : 'bg-gray-400/50 hover:bg-gray-400/80'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  )

  return (
    <div className="min-h-screen bg-[#f0f9f7] flex flex-col">
      <Header />

      
      

      
      <div className="flex-1">
        <AnimatePresence initial={false} custom={currentSection} mode="wait">
          <SectionWrapper sectionKey="hero">
              <div className="w-full py-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
                >
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-[#009178] text-5xl font-bold mb-4"
                  >
                    나누고 맞추고 플러스로 키우다
                  </motion.div>
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl font-bold text-[#1f2937] mb-6 leading-tight"
                  >
                    <span className="text-[#009178]">Fi-Match<span className="text-[#DC321E]">⁺</span></span>
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg text-[#6b7280] max-w-3xl mx-auto leading-relaxed mb-8"
                  >
                    <strong>Fi</strong>(파이)로 자산을 나누고, 최적의 조합을 <strong>Match</strong>해서<br />
                    수익을 키워<strong>(+)</strong>나가는 스마트한 포트폴리오 플랫폼
                  </motion.p>

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-t-4 border-t-[#009178] hover:shadow-2xl transition-all h-full flex flex-col"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-[#009178]">
                            {feature.icon}
                          </div>
                          <h3 className="text-xl font-bold text-[#1f2937] truncate min-h-[28px]">{feature.title}</h3>
                        </div>
                        <p className="text-base text-[#6b7280] leading-relaxed text-left line-clamp-2 overflow-hidden min-h-[52px]">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
        </motion.div>
              </div>
            </SectionWrapper>
        </AnimatePresence>
      </div>

      
      <footer className="bg-[#004e42] text-white">
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-8">
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              
              <div className="mb-4 md:mb-0 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Fi-Match<span className="text-[#DC321E]">⁺</span></h3>
                <p className="text-gray-300 text-sm">
                  나누고 맞추고 플러스로 키우다
                </p>
              </div>

              
              <div className="text-center md:text-right text-sm text-gray-300">
                <p className="font-semibold text-white mb-1">고객센터</p>
                <p>1588-0000</p>
                <p className="text-xs text-gray-400">평일 09:00~18:00</p>
              </div>
            </div>

            
            <div className="border-t border-gray-600 pt-4">
              <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                <div className="mb-2 md:mb-0">
                  <p>© 2025 Fi-Match<span className="text-[#DC321E]">⁺</span>. All rights reserved.</p>
                </div>
                <div className="flex gap-4">
                  <Link href="#" className="hover:text-gray-300 transition-colors">개인정보처리방침</Link>
                  <Link href="#" className="hover:text-gray-300 transition-colors">이용약관</Link>
                  <Link href="#" className="hover:text-gray-300 transition-colors">투자유의사항</Link>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 leading-relaxed text-center md:text-left">
                <p>투자 위험 고지: 모든 투자에는 원금 손실의 위험이 있습니다. 과거 수익률이 미래 수익률을 보장하지 않습니다.</p>
                <p>본 서비스는 투자 참고용이며, 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}