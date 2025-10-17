"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function BacktestNotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#f0f9f7]">
      <Header />
      <main className="max-w-5xl mx-auto pt-8 px-4 pb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-[#1f2937] hover:text-[#009178]">
          <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
        </Button>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-6">📊</div>
          <h1 className="text-3xl font-bold text-[#1f2937] mb-4">백테스트를 찾을 수 없습니다</h1>
          <p className="text-[#6b7280] text-lg mb-8 max-w-md mx-auto">
            요청하신 백테스트 내역이 존재하지 않거나 삭제되었습니다.
          </p>
          
          <div className="space-y-4">
            <Button
              onClick={() => router.push("/portfolios")}
              className="bg-[#009178] hover:bg-[#004e42] text-white px-8 py-3 text-lg font-semibold"
            >
              포트폴리오로 돌아가기
            </Button>
            <div className="text-sm text-[#6b7280]">
              또는 <Link 
                href="/portfolios"
                className="text-[#009178] hover:text-[#004e42] underline"
              >
                포트폴리오 목록
              </Link>으로 돌아가세요
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


