"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import Header from "@/components/header"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    router.push("/")
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login({ email, password })
      router.push("/")
    } catch (err) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = () => {
    router.push("/signup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f7] via-white to-[#f0f9f7]/30">
      <Header />
      <div className="flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border border-[#d1ebe7]">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-black text-[#009178] flex items-center justify-center gap-2">
              Fi-Match<span className="text-[#DC321E]">⁺</span>
            </h1>
            <p className="text-[#374151] text-sm">로그인하여 투자 관리를 시작하세요</p>
          </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full bg-[#009178] hover:bg-[#007a6b] text-white font-semibold py-3"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border border-[#d1ebe7] text-[#374151] hover:bg-[#f0f9f7] font-semibold py-3"
              onClick={handleSignup}
              disabled={isLoading}
            >
              회원가입
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-[#374151]">
          <p>계정이 없으신가요? 회원가입을 진행해주세요.</p>
        </div>
      </Card>
      </div>
    </div>
  )
}
