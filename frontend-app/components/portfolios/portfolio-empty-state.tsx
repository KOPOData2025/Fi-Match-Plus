"use client"

import { motion } from "framer-motion"
import Link from "next/link"

interface PortfolioEmptyStateProps {
  onShowAll: () => void
}

export default function PortfolioEmptyState({ onShowAll }: PortfolioEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="text-center py-16"
    >
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-2xl font-bold text-[#1f2937] mb-2">포트폴리오가 없습니다</h3>
      <p className="text-[#6b7280] text-lg mb-6">사용자 포트폴리오가 없습니다.</p>
      <Link href="/products">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#009178] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004e42] transition-colors"
        >
          모델 포트폴리오 구경하기
        </motion.button>
      </Link>
    </motion.div>
  )
}
