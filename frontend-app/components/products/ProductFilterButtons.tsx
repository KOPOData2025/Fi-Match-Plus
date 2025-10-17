"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from "@/types/product"

interface ProductFilterButtonsProps {
  selectedRiskLevel: string | null
  onRiskLevelChange: (riskLevel: string | null) => void
}

export function ProductFilterButtons({ 
  selectedRiskLevel, 
  onRiskLevelChange 
}: ProductFilterButtonsProps) {
  const riskLevels = [
    { key: 'LOW', label: RISK_LEVEL_LABELS.LOW },
    { key: 'MEDIUM', label: RISK_LEVEL_LABELS.MEDIUM },
    { key: 'HIGH', label: RISK_LEVEL_LABELS.HIGH },
    { key: 'VERY_HIGH', label: RISK_LEVEL_LABELS.VERY_HIGH }
  ]

  return (
    <div className="flex flex-wrap gap-2">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant={selectedRiskLevel === null ? "default" : "outline"}
          size="sm"
          onClick={() => onRiskLevelChange(null)}
          className={selectedRiskLevel === null ? "bg-[#009178] hover:bg-[#004e42]" : ""}
        >
          전체
        </Button>
      </motion.div>
      
      {riskLevels.map((riskLevel) => (
        <motion.div 
          key={riskLevel.key}
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={selectedRiskLevel === riskLevel.key ? "default" : "outline"}
            size="sm"
            onClick={() => onRiskLevelChange(riskLevel.key)}
            className={selectedRiskLevel === riskLevel.key ? 
              "bg-[#009178] hover:bg-[#004e42]" : 
              "hover:bg-gray-50"
            }
          >
            {riskLevel.label}
          </Button>
        </motion.div>
      ))}
    </div>
  )
}




