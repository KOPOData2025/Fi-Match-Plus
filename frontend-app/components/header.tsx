"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

function Header() {
  const { isAuthenticated, user, logout } = useAuth()

  const navigationItems = [
    { href: "/products", label: "상품" },
    { href: "/stocks", label: "종목 정보" },
    { href: "/portfolios", label: "포트폴리오" },
  ]

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white/95 backdrop-blur-sm shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-8 py-4">
        
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-3xl font-black text-[#009178] flex items-center gap-2 cursor-pointer"
          >
            Fi-Match<span className="text-[#DC321E]">⁺</span>
          </motion.div>
        </Link>

        
        <nav>
          <ul className="flex gap-16 list-none">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <motion.div whileHover={{ scale: 1.1 }}>
                  {item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      className="text-[#374151] font-semibold text-lg hover:text-[#009178] transition-all duration-300"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-[#374151] font-semibold text-lg hover:text-[#009178] transition-all duration-300"
                    >
                      {item.label}
                    </a>
                  )}
                </motion.div>
              </li>
            ))}
          </ul>
        </nav>

        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="text-black font-semibold text-lg">
                {user?.name}님 환영합니다!
              </div>
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={logout}
                className="px-5 py-3 border border-[#d1ebe7] rounded-lg font-semibold text-lg text-[#374151] hover:bg-[#f0f9f7] transition-all"
              >
                로그아웃
              </motion.button>
            </>
          ) : (
            <Link href="/login">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-3 bg-[#009178] text-white rounded-lg font-semibold text-lg hover:bg-[#007a6b] transition-all"
              >
                로그인
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  )
}

export { Header }
export default Header
