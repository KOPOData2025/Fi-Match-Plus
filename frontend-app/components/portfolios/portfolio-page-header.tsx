"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

export default function PortfolioPageHeader() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="max-w-6xl mx-auto p-4 pt-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl bg-[#009178] text-white hover:bg-[#004e42] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#1f2937]">내 포트폴리오</h1>
            <p className="text-[#6b7280] text-lg">모든 투자 포트폴리오를 관리하세요</p>
          </div>
        </div>
        <Link href="/portfolios/create">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-[#009178] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004e42] transition-colors"
          >
            <Plus className="w-5 h-5" />새 포트폴리오
          </motion.button>
        </Link>
      </div>
    </motion.section>
  )
}
